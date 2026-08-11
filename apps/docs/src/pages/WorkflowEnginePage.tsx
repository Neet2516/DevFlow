import React from 'react';
import DocPage from '../components/DocPage';
import Callout from '../components/Callout';
import CodeBlock from '../components/CodeBlock';

const TOC = [
  { id: 'overview',    text: 'Overview',        level: 2 },
  { id: 'stateless',   text: 'Stateless design', level: 2 },
  { id: 'data-flow',   text: 'Data flow',        level: 2 },
  { id: 'edge-cases',  text: 'Edge cases',       level: 2 },
];

const WorkflowEnginePage: React.FC = () => (
  <DocPage title="Workflow Engine" description="The control-plane brain of DevFlow — dependency resolution, scheduling, and state management." toc={TOC}>

    <h2 id="overview">Overview</h2>
    <p>
      The Pipeline Engine is DevFlow's control plane. It owns dependency resolution, drives job scheduling,
      tracks execution state, and orchestrates failure recovery — but it <strong>never executes user workloads</strong>.
    </p>
    <p>
      This separation is key: a compromised or crashing worker cannot corrupt the scheduling state because
      the two planes never share memory.
    </p>

    <h2 id="stateless">Stateless engine, stateful store</h2>
    <p>
      The Pipeline Engine holds no long-lived in-memory execution state. Every scheduling decision is derived
      by reading <code>Execution</code> and <code>JobExecution</code> rows from PostgreSQL plus recent Events
      from the Event Bus.
    </p>

    <Callout type="note">
      This means any Engine instance can pick up any Execution, enabling horizontal scaling and crash recovery
      without complex leader election. An Engine crash loses <em>zero</em> progress.
    </Callout>

    <h2 id="data-flow">Data flow</h2>
    <ol>
      <li><code>POST /executions</code> creates an Execution row (status <code>pending</code>) and asks the Engine to start it.</li>
      <li>Engine loads the DAG for the referenced PipelineVersion, identifies root nodes (zero dependencies), and asks the Scheduler to enqueue them.</li>
      <li>Engine subscribes to <code>job.completed</code>/<code>job.failed</code> events scoped to this Execution on the Event Bus.</li>
      <li>On each completion event, Engine recomputes which downstream nodes are now unblocked and enqueues them via the Scheduler.</li>
      <li>When all nodes reach a terminal state, Engine marks the Execution <code>succeeded</code> or <code>failed</code> and publishes <code>execution.completed</code>.</li>
    </ol>

    <h2 id="edge-cases">Edge cases</h2>
    <ul>
      <li><strong>Diamond dependencies</strong> (A→B, A→C, B→D, C→D): D must only be enqueued once both B and C complete. The Engine tracks per-node "pending dependency count", decrementing on each relevant completion event, enqueuing at zero.</li>
      <li><strong>Duplicate completion events</strong> (at-least-once delivery): must not double-decrement dependency counts — decrements are idempotent, keyed on <code>(jobExecutionId, eventId)</code>.</li>
      <li><strong>Scheduler restart mid-pipeline</strong>: must reconstruct in-flight state from the Database, not from memory — this is guaranteed by the stateless-engine design.</li>
    </ul>

  </DocPage>
);

export default WorkflowEnginePage;
