import { prisma } from '@devflow/db';
import { Scheduler } from '@devflow/scheduler';
import { DevFlowEvent, PipelineDAG, isValidJobTransition } from '@devflow/shared';

/**
 * Handles incoming Event Bus events and drives the execution state machine.
 * @param event Event Bus payload.
 * @param scheduler Scheduler instance.
 */
export async function handleJobEvents(
  event: DevFlowEvent,
  scheduler: Scheduler
): Promise<void> {
  const { executionId } = event;

  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    include: {
      pipelineVersion: {
        include: {
          jobs: true,
        },
      },
      jobExecutions: true,
    },
  });

  if (!execution) {
    console.error(`Execution with ID ${executionId} not found for event ${event.type}`);
    return;
  }

  const latestVersion = execution.pipelineVersion;
  const dag = latestVersion.dagJson as unknown as PipelineDAG;

  if (event.type === 'job.started') {
    const je = execution.jobExecutions.find((j) => j.id === event.jobExecutionId);
    if (je && isValidJobTransition(je.status as any, 'running')) {
      await prisma.jobExecution.update({
        where: { id: je.id },
        data: {
          status: 'running',
          startedAt: new Date(event.timestamp),
          workerId: event.workerId,
        },
      });
    }
  }

  else if (event.type === 'job.completed') {
    const je = execution.jobExecutions.find((j) => j.id === event.jobExecutionId);
    if (je && isValidJobTransition(je.status as any, 'succeeded')) {
      await prisma.jobExecution.update({
        where: { id: je.id },
        data: {
          status: 'succeeded',
          finishedAt: new Date(event.timestamp),
        },
      });

      // Reload job executions to get the fresh states
      const updatedJobExecutions = await prisma.jobExecution.findMany({
        where: { executionId },
      });

      const execMap = new Map<string, string>();
      for (const j of updatedJobExecutions) {
        const clientJobId = j.jobId.split('_').slice(1).join('_');
        execMap.set(clientJobId, j.status);
      }

      // Check if all jobs in DAG have reached terminal statuses
      const allTerminal = dag.jobs.every((job) => {
        const status = execMap.get(job.id);
        return status === 'succeeded' || status === 'skipped' || status === 'failed_terminal' || status === 'cancelled';
      });

      if (allTerminal) {
        const anyFailed = updatedJobExecutions.some((j) => j.status === 'failed_terminal');
        const nextStatus = anyFailed ? 'failed' : 'succeeded';
        await prisma.execution.update({
          where: { id: executionId },
          data: {
            status: nextStatus,
            finishedAt: new Date(),
          },
        });
      } else {
        // Enqueue next unblocked jobs
        for (const job of dag.jobs) {
          const status = execMap.get(job.id);
          if (status !== 'pending') continue;

          const allDepsSucceeded = job.dependsOn.every((depId) => execMap.get(depId) === 'succeeded');
          const anyDepFailedOrSkipped = job.dependsOn.some((depId) => {
            const depStatus = execMap.get(depId);
            return depStatus === 'failed_terminal' || depStatus === 'skipped';
          });

          const currentJe = updatedJobExecutions.find((j) => j.jobId === `${latestVersion.id}_${job.id}`)!;

          if (allDepsSucceeded) {
            const cmd = (job as any).cmd || `echo "Executing ${job.name}..."; sleep 1; echo "${job.name} complete!"`;
            await scheduler.enqueueJob(currentJe.id, job.type, {
              pipelineId: latestVersion.pipelineId,
              executionId,
              jobId: job.id,
              attempt: currentJe.attempt,
              cmd,
            });
          } else if (anyDepFailedOrSkipped) {
            await prisma.jobExecution.update({
              where: { id: currentJe.id },
              data: {
                status: 'skipped',
                finishedAt: new Date(),
              },
            });
            await skipDownstream(executionId, job.id, dag.jobs, updatedJobExecutions);
          }
        }
      }
    }
  }

  else if (event.type === 'job.failed') {
    const je = execution.jobExecutions.find((j) => j.id === event.jobExecutionId);
    if (je && isValidJobTransition(je.status as any, 'failed')) {
      const clientJobId = je.jobId.split('_').slice(1).join('_');
      const jobDef = dag.jobs.find((j) => j.id === clientJobId)!;
      const retryPolicy = jobDef.retryPolicy;

      const attempt = je.attempt;
      const maxAttempts = retryPolicy?.maxAttempts ?? 1;

      if (attempt < maxAttempts) {
        const backoff = retryPolicy.backoff;
        let delay = backoff.baseMs || 1000;
        if (backoff.type === 'exponential') {
          delay = delay * Math.pow(2, attempt - 1);
        }
        delay = Math.min(delay, backoff.maxMs || 30000);

        console.log(`Scheduling retry attempt ${attempt + 1} for job ${je.id} in ${delay}ms`);

        await prisma.jobExecution.update({
          where: { id: je.id },
          data: {
            status: 'retrying',
            attempt: attempt + 1,
          },
        });

        setTimeout(async () => {
          const cmd = (jobDef as any).cmd || `echo "Executing ${jobDef.name}..."; sleep 1; echo "${jobDef.name} complete!"`;
          await scheduler.enqueueJob(je.id, jobDef.type, {
            pipelineId: latestVersion.pipelineId,
            executionId,
            jobId: clientJobId,
            attempt: attempt + 1,
            cmd,
          });
        }, delay);
      } else {
        await prisma.jobExecution.update({
          where: { id: je.id },
          data: {
            status: 'failed_terminal',
            finishedAt: new Date(event.timestamp),
          },
        });

        await skipDownstream(executionId, clientJobId, dag.jobs, execution.jobExecutions);

        await prisma.execution.update({
          where: { id: executionId },
          data: {
            status: 'failed',
            finishedAt: new Date(),
          },
        });
      }
    }
  }
}

/**
 * Recursively skips downstream jobs that depend on a failed parent.
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
