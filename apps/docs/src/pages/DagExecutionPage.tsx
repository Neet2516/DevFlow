import React from 'react';
import DocPage from '../components/DocPage';
import Callout from '../components/Callout';
import CodeBlock from '../components/CodeBlock';

const TOC = [
  { id: 'overview',     text: 'Overview',         level: 2 },
  { id: 'cycle-detect', text: 'Cycle detection',  level: 2 },
  { id: 'readiness',    text: 'Readiness counting',level: 2 },
  { id: 'conditional',  text: 'Conditional edges', level: 2 },
  { id: 'edge-cases',   text: 'Edge cases',        level: 2 },
];

const DagExecutionPage: React.FC = () => (
  <DocPage title="DAG Execution" description="How pipeline DAGs are validated, compiled, and walked during execution." toc={TOC}>

    <h2 id="overview">Overview</h2>
    <p>
      When a developer defines a pipeline, they create a <strong>Directed Acyclic Graph (DAG)</strong> of jobs —
      nodes connected by dependency edges. DevFlow's <code>packages/graph-engine</code> validates this graph at
      authoring time and tracks per-node readiness at runtime.
    </p>

    <h2 id="cycle-detect">Cycle detection</h2>
    <p>
      Cycle detection runs synchronously on every pipeline save, using a <strong>Depth-First Search (DFS)</strong>{' '}
      with a recursion stack (Tarjan's approach). Rejecting cycles at authoring time is far cheaper than
      discovering a deadlocked execution at runtime.
    </p>
    <CodeBlock language="typescript" code={`// Simplified cycle detection in @devflow/graph-engine
function detectCycles(nodes: Job[], edges: Edge[]): string[] | null {
  const adjacency = buildAdjacencyList(nodes, edges);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    for (const neighbor of adjacency[nodeId] ?? []) {
      if (!visited.has(neighbor) && dfs(neighbor)) return true;
      if (recursionStack.has(neighbor)) return true;
    }
    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && dfs(node.id)) {
      return extractCycle(recursionStack); // returns offending node IDs
    }
  }
  return null; // acyclic — safe to save
}`} />

    <Callout type="danger" title="Invalid DAG — 422 response">
      A pipeline with a cycle (A → B → C → A) is rejected with HTTP <code>422 Unprocessable Entity</code>{' '}
      and a per-node error list identifying which nodes form the cycle.
    </Callout>

    <h2 id="readiness">Readiness counting</h2>
    <p>
      Rather than pre-computing a single linear topological order, DevFlow uses{' '}
      <strong>topological readiness counting</strong>. Each node tracks an{' '}
      <code>unresolvedDependencyCount</code>, decremented as each dependency completes.
      A node with <code>unresolvedDependencyCount === 0</code> is ready to execute.
    </p>
    <p>
      This approach naturally handles parallel branches and fan-in patterns (diamond dependencies)
      without special-casing them.
    </p>

    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-5 font-mono text-xs overflow-x-auto my-5">
      <pre className="text-slate-300 leading-relaxed">{`Diamond DAG example:

     A (root — unresolvedDeps: 0 → enqueued immediately)
    / \\
   B   C  (both wait for A; unresolvedDeps: 1 each)
    \\ /
     D    (waits for B AND C; unresolvedDeps: 2)
          → only enqueued when both B and C complete`}</pre>
    </div>

    <h2 id="conditional">Conditional edges</h2>
    <p>
      Edges can be conditional — a downstream node is only unblocked if the upstream job's exit status
      or output matches the condition:
    </p>
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-5 font-mono text-xs overflow-x-auto my-5">
      <pre className="text-slate-300 leading-relaxed">{`Build → Test → Deploy   (success path)
              ↓
       Notify + Halt      (failure path — conditional on test failure)`}</pre>
    </div>
    <p>
      When a node is skipped (conditionally bypassed, not failed), downstream nodes with non-strict
      dependency policy can still proceed. Strict-dependency nodes are also skipped by default.
    </p>

    <h2 id="edge-cases">Edge cases</h2>
    <ul>
      <li><strong>Orphaned nodes</strong> (no path from any root) are rejected at validation time. Every node must be reachable from at least one root.</li>
      <li><strong>Self-referencing dependency</strong> (<code>dependsOn: [ownId]</code>) is a degenerate cycle caught by the same DFS check.</li>
      <li><strong>Duplicate completion events</strong> (at-least-once delivery) are idempotent — decrements are keyed on <code>(jobExecutionId, eventId)</code> to prevent double-counting.</li>
      <li><strong>Diamond convergence</strong> — node D must only be enqueued once, not once per upstream completion. The decrement-to-zero mechanism guarantees this.</li>
    </ul>

  </DocPage>
);

export default DagExecutionPage;
