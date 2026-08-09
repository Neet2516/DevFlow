"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDag = buildDag;
const detectCycles_js_1 = require("./detectCycles.js");
/**
 * Builds and validates a pipeline DAG.
 * @param dag Pipeline DAG definition from database or user request.
 * @returns Validation result containing errors, cycles, orphaned nodes, and resolved topological order.
 */
function buildDag(dag) {
    const errors = [];
    const jobs = dag.jobs || [];
    // 1. Check for duplicate IDs
    const jobIds = new Set();
    const duplicates = new Set();
    for (const job of jobs) {
        if (jobIds.has(job.id)) {
            duplicates.add(job.id);
        }
        jobIds.add(job.id);
    }
    if (duplicates.size > 0) {
        errors.push(`Duplicate job IDs found: ${Array.from(duplicates).join(', ')}`);
    }
    // 2. Check for missing dependencies
    for (const job of jobs) {
        for (const dep of job.dependsOn) {
            if (!jobIds.has(dep)) {
                errors.push(`Job "${job.id}" depends on missing job "${dep}"`);
            }
        }
    }
    // 3. Cycle Detection
    const cycles = (0, detectCycles_js_1.detectCycles)(jobs);
    if (cycles.length > 0) {
        for (const cycle of cycles) {
            errors.push(`Cycle detected: ${cycle.join(' -> ')}`);
        }
    }
    // 4. Identify Root Nodes & Reachability (Orphaned Nodes)
    const roots = jobs.filter((j) => !j.dependsOn || j.dependsOn.length === 0);
    const reached = new Set();
    // Build adjacency list for forward traversal: parent -> children
    const adj = new Map();
    for (const job of jobs) {
        adj.set(job.id, []);
    }
    for (const job of jobs) {
        for (const dep of job.dependsOn) {
            if (adj.has(dep)) {
                adj.get(dep).push(job.id);
            }
        }
    }
    // Traverse from root nodes
    const queue = roots.map((r) => r.id);
    for (const rootId of queue) {
        reached.add(rootId);
    }
    let head = 0;
    while (head < queue.length) {
        const u = queue[head++];
        const children = adj.get(u) || [];
        for (const v of children) {
            if (!reached.has(v)) {
                reached.add(v);
                queue.push(v);
            }
        }
    }
    const orphanedNodes = [];
    for (const job of jobs) {
        if (!reached.has(job.id)) {
            orphanedNodes.push(job.id);
        }
    }
    if (orphanedNodes.length > 0) {
        errors.push(`Orphaned/unreachable jobs found (no path from root): ${orphanedNodes.join(', ')}`);
    }
    // 5. Compute Topological Order (resolvedOrder)
    const resolvedOrder = [];
    if (errors.length === 0) {
        const inDegree = new Map();
        for (const job of jobs) {
            inDegree.set(job.id, job.dependsOn.length);
        }
        const q = [];
        for (const job of jobs) {
            if (inDegree.get(job.id) === 0) {
                q.push(job.id);
            }
        }
        while (q.length > 0) {
            const u = q.shift();
            resolvedOrder.push(u);
            const children = adj.get(u) || [];
            for (const v of children) {
                const degree = inDegree.get(v) - 1;
                inDegree.set(v, degree);
                if (degree === 0) {
                    q.push(v);
                }
            }
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        cycles,
        orphanedNodes,
        resolvedOrder,
    };
}
//# sourceMappingURL=buildDag.js.map