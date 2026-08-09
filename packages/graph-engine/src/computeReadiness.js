"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeReadiness = computeReadiness;
/**
 * Computes the readiness state of a DAG given a set of completed jobs.
 * @param dag Pipeline DAG definition.
 * @param completedJobIds Set of job IDs that have already finished successfully.
 * @returns Record of unresolved dependency counts per job, and the list of job IDs currently ready.
 */
function computeReadiness(dag, completedJobIds) {
    const unresolvedDependencyCount = {};
    const readyJobs = [];
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
//# sourceMappingURL=computeReadiness.js.map