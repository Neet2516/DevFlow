import { prisma } from '@devflow/db';
import { buildDag } from '@devflow/graph-engine';
import { Scheduler } from '@devflow/scheduler';
import { PipelineDAG } from '@devflow/shared';

/**
 * Initializes and starts a new execution of a pipeline.
 * @param pipelineId Pipeline ID to run.
 * @param scheduler Scheduler instance.
 * @returns Execution ID.
 */
export async function startExecution(
  pipelineId: string,
  scheduler: Scheduler,
  variables: Record<string, string> = {}
): Promise<string> {
  // 1. Fetch latest version of the pipeline
  const pipeline = await prisma.pipeline.findUnique({
    where: { id: pipelineId },
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { jobs: true },
      },
    },
  });

  if (!pipeline || pipeline.versions.length === 0) {
    throw new Error(`Pipeline "${pipelineId}" has no versions configured.`);
  }

  const latestVersion = pipeline.versions[0];
  const dag = latestVersion.dagJson as unknown as PipelineDAG;

  // 2. Validate DAG (integrity check)
  const validation = buildDag(dag);
  if (!validation.isValid) {
    throw new Error(`DAG validation failed: ${validation.errors.join(', ')}`);
  }

  // 3. Create Execution record (status 'running')
  const execution = await prisma.execution.create({
    data: {
      pipelineVersionId: latestVersion.id,
      status: 'running',
      startedAt: new Date(),
    },
  });

  // 4. Create JobExecution records (status 'pending')
  const jobExecutions = await Promise.all(
    dag.jobs.map(async (job) => {
      const dbJobId = `${latestVersion.id}_${job.id}`;
      return prisma.jobExecution.create({
        data: {
          executionId: execution.id,
          jobId: dbJobId,
          status: 'pending',
          attempt: 1,
        },
      });
    })
  );

  // Create lookup map of client job ID -> DB JobExecution record
  const jobExecMap = new Map<string, any>();
  for (const je of jobExecutions) {
    const parts = je.jobId.split('_');
    const clientJobId = parts.slice(1).join('_');
    jobExecMap.set(clientJobId, je);
  }

  // Helper to substitute variables into command string
  const applyVariables = (rawCmd: string): string => {
    let result = rawCmd;
    for (const [k, v] of Object.entries(variables)) {
      result = result.replaceAll(`\${${k}}`, v).replaceAll(`$${k}`, v);
    }
    return result;
  };

  // 5. Identify root nodes (zero dependencies)
  const rootJobs = dag.jobs.filter((j) => !j.dependsOn || j.dependsOn.length === 0);

  // 6. Enqueue root jobs
  for (const job of rootJobs) {
    const jobExecution = jobExecMap.get(job.id);
    if (!jobExecution) continue;

    let cmd = (job as any).cmd || `echo "Executing ${job.name}..."; sleep 1; echo "${job.name} complete!"`;
    cmd = applyVariables(cmd);

    await scheduler.enqueueJob(jobExecution.id, job.type, {
      pipelineId,
      executionId: execution.id,
      jobId: job.id,
      attempt: 1,
      cmd,
      variables,
    });
  }

  return execution.id;
}
