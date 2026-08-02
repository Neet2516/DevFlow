import { JobDefinition, PipelineDAG } from '@devflow/shared';
import { detectCycles } from './detectCycles.js';
import { DAGValidationResult } from './types.js';

/**
 * Builds and validates a pipeline DAG.
 * @param dag Pipeline DAG definition from database or user request.
 * @returns Validation result containing errors, cycles, orphaned nodes, and resolved topological order.
 */
export function buildDag(dag: PipelineDAG): DAGValidationResult {
  const errors: string[] = [];
  const jobs = dag.jobs || [];

  // 1. Check for duplicate IDs
  const jobIds = new Set<string>();
  const duplicates = new Set<string>();
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
  const cycles = detectCycles(jobs);
  if (cycles.length > 0) {
    for (const cycle of cycles) {
      errors.push(`Cycle detected: ${cycle.join(' -> ')}`);
    }
  }

  // 4. Identify Root Nodes & Reachability (Orphaned Nodes)
  const roots = jobs.filter((j) => !j.dependsOn || j.dependsOn.length === 0);
  const reached = new Set<string>();

  // Build adjacency list for forward traversal: parent -> children
  const adj = new Map<string, string[]>();
  for (const job of jobs) {
    adj.set(job.id, []);
  }
  for (const job of jobs) {
    for (const dep of job.dependsOn) {
      if (adj.has(dep)) {
        adj.get(dep)!.push(job.id);
      }
    }
  }

  // Traverse from root nodes
  const queue: string[] = roots.map((r) => r.id);
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

  const orphanedNodes: string[] = [];
  for (const job of jobs) {
    if (!reached.has(job.id)) {
      orphanedNodes.push(job.id);
    }
  }

  if (orphanedNodes.length > 0) {
    errors.push(
      `Orphaned/unreachable jobs found (no path from root): ${orphanedNodes.join(
        ', '
      )}`
    );
  }

  // 5. Compute Topological Order (resolvedOrder)
  const resolvedOrder: string[] = [];
  if (errors.length === 0) {
    const inDegree = new Map<string, number>();
    for (const job of jobs) {
      inDegree.set(job.id, job.dependsOn.length);
    }

    const q: string[] = [];
    for (const job of jobs) {
      if (inDegree.get(job.id) === 0) {
        q.push(job.id);
      }
    }

    while (q.length > 0) {
      const u = q.shift()!;
      resolvedOrder.push(u);
      const children = adj.get(u) || [];
      for (const v of children) {
        const degree = inDegree.get(v)! - 1;
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
