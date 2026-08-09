"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCycles = detectCycles;
/**
 * Detects cycles in a directed graph of jobs.
 * @param jobs List of jobs with their IDs and dependencies.
 * @returns Array of cycles, where each cycle is represented as an array of job IDs.
 */
function detectCycles(jobs) {
    const adj = new Map();
    for (const job of jobs) {
        adj.set(job.id, []);
    }
    // Build adjacency list: u -> v means u must run before v (v depends on u)
    for (const job of jobs) {
        for (const dep of job.dependsOn) {
            if (adj.has(dep)) {
                adj.get(dep).push(job.id);
            }
        }
    }
    const colors = new Map(); // 0: unvisited, 1: visiting, 2: visited
    for (const job of jobs) {
        colors.set(job.id, 0);
    }
    const cycles = [];
    function dfs(u, path) {
        colors.set(u, 1);
        path.push(u);
        const children = adj.get(u) || [];
        for (const v of children) {
            const color = colors.get(v);
            if (color === 1) {
                // Cycle detected
                const cycleStartIndex = path.indexOf(v);
                if (cycleStartIndex !== -1) {
                    const cycle = path.slice(cycleStartIndex);
                    cycle.push(v); // close the loop visually
                    cycles.push(cycle);
                }
            }
            else if (color === 0) {
                dfs(v, path);
            }
        }
        path.pop();
        colors.set(u, 2);
    }
    for (const job of jobs) {
        if (colors.get(job.id) === 0) {
            dfs(job.id, []);
        }
    }
    return cycles;
}
//# sourceMappingURL=detectCycles.js.map