import { prisma } from '@devflow/db';
import { Scheduler } from '@devflow/scheduler';
import { PipelineDAG } from '@devflow/shared';

/**
 * Starts the background worker liveness check loop (running every 5 seconds).
 * @param redis Redis client instance.
 * @param scheduler Scheduler instance.
 */
export function startLivenessMonitor(redis: any, scheduler: Scheduler): void {
  console.log('Execution liveness monitor started (5s sweep)...');

  setInterval(async () => {
    try {
      // 1. Identify workers in idle/busy status whose heartbeats are older than 15s (3 intervals)
      const staleWorkers = await prisma.worker.findMany({
        where: {
          status: { in: ['idle', 'busy'] },
          lastHeartbeat: { lt: new Date(Date.now() - 15000) },
        },
      });

      for (const worker of staleWorkers) {
        console.warn(`Worker [${worker.id}] has gone offline (missed heartbeats)`);

        // Mark worker offline
        await prisma.worker.update({
          where: { id: worker.id },
          data: { status: 'offline' },
        });

        // 2. Identify running jobs abandoned on this worker
        const abandonedJobs = await prisma.jobExecution.findMany({
          where: {
            workerId: worker.id,
            status: 'running',
          },
          include: {
            execution: {
              include: {
                pipelineVersion: true,
              },
            },
          },
        });

        for (const jobExecution of abandonedJobs) {
          const execution = jobExecution.execution;
          const pipelineVersion = execution.pipelineVersion;
          const dag = pipelineVersion.dagJson as unknown as PipelineDAG;

          const parts = jobExecution.jobId.split('_');
          const clientJobId = parts.slice(1).join('_');
          const jobDef = dag.jobs.find((j) => j.id === clientJobId);

          if (!jobDef) {
            console.error(`Could not find job definition for ${clientJobId} in DAG`);
            continue;
          }

          // Count infra attempts using an atomic Redis increment
          const redisKey = `infra_retries:${jobExecution.id}`;
          const infraAttempts = await redis.incr(redisKey);
          await redis.expire(redisKey, 86400); // 1-day TTL

          if (infraAttempts <= 3) {
            console.warn(
              `Recovering job execution [${jobExecution.id}] (infra attempt ${infraAttempts}/3) - Re-scheduling...`
            );

            // Re-set status to pending in DB so scheduler can fire it
            await prisma.jobExecution.update({
              where: { id: jobExecution.id },
              data: { status: 'pending', workerId: null, startedAt: null },
            });

            // Enqueue back to the job's target queue
            const cmd = (jobDef as any).cmd || `echo "Executing ${jobDef.name}..."; sleep 1; echo "${jobDef.name} complete!"`;
            await scheduler.enqueueJob(jobExecution.id, jobDef.type, {
              pipelineId: pipelineVersion.pipelineId,
              executionId: jobExecution.executionId,
              jobId: clientJobId,
              attempt: jobExecution.attempt,
              cmd,
            });
          } else {
            console.error(
              `Job execution [${jobExecution.id}] exceeded infra retry limit (3/3). Marking failed.`
            );

            await redis.del(redisKey);

            // Mark job failed terminally
            await prisma.jobExecution.update({
              where: { id: jobExecution.id },
              data: {
                status: 'failed_terminal',
                finishedAt: new Date(),
              },
            });

            // Skip downstream nodes
            const allExecutions = await prisma.jobExecution.findMany({
              where: { executionId: execution.id },
            });
            await skipDownstream(execution.id, clientJobId, dag.jobs, allExecutions);

            // Fail overall pipeline execution
            await prisma.execution.update({
              where: { id: execution.id },
              data: {
                status: 'failed',
                finishedAt: new Date(),
              },
            });
          }
        }
      }
    } catch (err) {
      console.error('Error in liveness monitor sweep:', err);
    }
  }, 5000);
}

/**
 * Recursively marks downstream jobs as skipped on terminal failure.
 */
async function skipDownstream(
  executionId: string,
  failedJobId: string,
  latestVersionJobs: any[],
  jobExecutions: any[]
) {
  const jobExecMap = new Map<string, any>();
  for (const je of jobExecutions) {
    const parts = je.jobId.split('_');
    const clientJobId = parts.slice(1).join('_');
    jobExecMap.set(clientJobId, je);
  }

  const skipped = new Set<string>();
  const toSkip = [failedJobId];

  while (toSkip.length > 0) {
    const parentId = toSkip.pop()!;
    const children = latestVersionJobs.filter((job) => job.dependsOn.includes(parentId));
    for (const child of children) {
      if (!skipped.has(child.id)) {
        skipped.add(child.id);
        toSkip.push(child.id);

        const je = jobExecMap.get(child.id);
        if (je && je.status === 'pending') {
          await prisma.jobExecution.update({
            where: { id: je.id },
            data: { status: 'skipped', finishedAt: new Date() },
          });
        }
      }
    }
  }
}
