"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffDag = diffDag;
function diffDag(dagA, dagB) {
    const mapA = new Map(dagA.jobs.map(j => [j.id, j]));
    const mapB = new Map(dagB.jobs.map(j => [j.id, j]));
    const addedJobs = [];
    const removedJobs = [];
    const modifiedJobs = [];
    for (const [id, jobB] of mapB) {
        if (!mapA.has(id)) {
            addedJobs.push(jobB);
        }
        else {
            const jobA = mapA.get(id);
            const changes = [];
            if (jobA.name !== jobB.name)
                changes.push(`Name changed: "${jobA.name}" → "${jobB.name}"`);
            if (jobA.type !== jobB.type)
                changes.push(`Type changed: "${jobA.type}" → "${jobB.type}"`);
            if (JSON.stringify(jobA.dependsOn.sort()) !== JSON.stringify(jobB.dependsOn.sort())) {
                changes.push(`Dependencies changed: [${jobA.dependsOn.join(', ')}] → [${jobB.dependsOn.join(', ')}]`);
            }
            if (jobA.cmd !== jobB.cmd)
                changes.push(`Command changed`);
            if (JSON.stringify(jobA.retryPolicy) !== JSON.stringify(jobB.retryPolicy)) {
                changes.push(`Retry policy updated`);
            }
            if (changes.length > 0) {
                modifiedJobs.push({ jobId: id, changes });
            }
        }
    }
    for (const [id, jobA] of mapA) {
        if (!mapB.has(id)) {
            removedJobs.push(jobA);
        }
    }
    return {
        addedJobs,
        removedJobs,
        modifiedJobs,
        hasChanges: addedJobs.length > 0 || removedJobs.length > 0 || modifiedJobs.length > 0,
    };
}
//# sourceMappingURL=diffDag.js.map