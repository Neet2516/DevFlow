import { PipelineDAG } from '@devflow/shared';

export interface ReadinessState {
  unresolvedDependencyCount: Record<string, number>;
  readyJobs: string[];
}

/**
 * Computes the readiness state of a DAG given a set of completed jobs.
 * @param dag Pipeline DAG definition.
 * @param completedJobIds Set of job IDs that have already finished successfully.
 * @returns Record of unresolved dependency counts per job, and the list of job IDs currently ready.
 */
export function computeReadiness(
  dag: PipelineDAG,
  completedJobIds: Set<string>
): ReadinessState {
  const unresolvedDependencyCount: Record<string, number> = {};
  const readyJobs: string[] = [];

  for (const job of dag.jobs) {
    const remainingDeps = job.dependsOn.filter((dep) => !completedJobIds.has(dep));
    unresolvedDependencyCount[job.id] = remainingDeps.length;

    if (remainingDeps.length === 0 && !completedJobIds.has(job.id)) {
      readyJobs.push(job.id);
    }
  }

  return {
    unresolvedDependencyCount,
    readyJobs,
  };
}
