import React from 'react';
import DocPage from '../components/DocPage';
import Callout from '../components/Callout';

const TOC = [
  { id: 'overview',         text: 'Overview',           level: 2 },
  { id: 'components',       text: 'Components',          level: 2 },
  { id: 'data-flow',        text: 'Data flow',           level: 2 },
  { id: 'design-decisions', text: 'Design decisions',    level: 2 },
  { id: 'ports',            text: 'Service ports',       level: 2 },
];

const ArchitecturePage: React.FC = () => (
  <DocPage title="System Architecture" description="Top-level architecture, component map, and data flow for DevFlow." toc={TOC}>

    <h2 id="overview">Overview</h2>
    <p>
      DevFlow is built on a <strong>control plane / data plane separation</strong>. The Pipeline Engine
      (control plane) never executes user code — it only resolves graphs and dispatches units of work to
      Worker Nodes (data plane). This isolates blast radius: a worker crash cannot corrupt scheduling state.
    </p>

    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-5 font-mono text-xs overflow-x-auto my-6">
      <pre className="text-slate-300 leading-relaxed">{`                         ┌──────────────────────────┐
                         │  React + Vite Dashboard  │
                         └────────────┬─────────────┘
                                      │ HTTP / WebSocket (:3003)
                                      ▼
                         ┌──────────────────────────┐
                         │    API Gateway (:3000)    │
                         └──────┬─────┬──────┬──────┘
                                │     │      │
        ┌───────────────────────┘     │      └─────────────────────┐
        ▼                             ▼                             ▼
┌──────────────────┐      ┌──────────────────┐          ┌──────────────────┐
│ Pipeline (:3001)  │      │ Execution (:3002) │          │AI Analyzer(:3004)│
└──────────────────┘      └──────────────────┘          └──────────────────┘
          └────────────────────────┼────────────────────────┘
                                   ▼
                    ┌──────────────────────────┐
                    │   PostgreSQL (:5433)      │
                    └─────────────┬────────────┘
                                  ▲
                    ┌─────────────┴────────────┐
                    │  Redis Streams / BullMQ   │
                    └──┬──────┬──────┬──────┬──┘
                       ▼      ▼      ▼      ▼
                  build  test  docker  deploy  script
                  worker worker worker  worker  worker`}</pre>
    </div>

    <h2 id="components">Components</h2>
    <ul>
      <li><strong>Pipeline Engine</strong> — control plane; owns dependency resolution, job scheduling triggers, state management, failure recovery policy.</li>
      <li><strong>Dependency Graph Builder</strong> — converts a pipeline definition into a validated DAG (cycle detection, unreachable-node detection). Lives in <code>packages/graph-engine</code>.</li>
      <li><strong>Scheduler</strong> — decides when and on which worker a ready node executes; enforces concurrency limits. Lives in <code>packages/scheduler</code> using BullMQ.</li>
      <li><strong>Queue</strong> — durable, ordered handoff between Scheduler and Worker Nodes via Redis Streams consumer groups.</li>
      <li><strong>Worker Nodes</strong> — stateless executors; pull/receive jobs, run them in isolated processes, emit results to the Event Bus.</li>
      <li><strong>Event Bus</strong> — the nervous system; every state transition is published via Redis Streams and fanned out to database, WebSocket Gateway, and Notification Service.</li>
      <li><strong>WebSocket Gateway</strong> — subscribes to relevant event streams and pushes deltas to connected dashboard clients (port 3003).</li>
      <li><strong>Database (PostgreSQL)</strong> — system of record for pipelines, executions, jobs, workers, and audit trail, accessed via Prisma ORM.</li>
    </ul>

    <h2 id="data-flow">Data flow</h2>
    <ol>
      <li>Developer submits a pipeline definition through the Dashboard or REST API.</li>
      <li>Pipeline Engine validates with the Dependency Graph Builder, producing a DAG.</li>
      <li>Scheduler walks the DAG, enqueuing nodes whose dependencies are satisfied into Redis Streams.</li>
      <li>Worker Nodes consume from the Queue, execute, and publish <code>job.started</code> / <code>job.completed</code> / <code>job.failed</code> events.</li>
      <li>Event Bus fans events to Postgres (durability), WebSocket Gateway (real-time UI), and Notification Service.</li>
      <li>Scheduler consumes completion events to unlock downstream nodes, closing the loop.</li>
    </ol>

    <h2 id="design-decisions">Design decisions</h2>
    <ul>
      <li><strong>Event Bus as integration point</strong> — not direct service-to-service calls. Adding a new consumer requires zero changes to existing producers.</li>
      <li><strong>Queue between Scheduler and Workers</strong> — not RPC, so scheduling decisions survive worker restarts and support natural backpressure.</li>
      <li><strong>Redis Streams over Pub/Sub</strong> — Streams persist events and support consumer groups with replay. Pub/Sub messages are lost if no consumer is listening.</li>
    </ul>

    <Callout type="note">
      Every event carries <code>pipelineId</code>, <code>executionId</code>, <code>jobId</code>, and a monotonic{' '}
      <code>sequence</code> number — this is what makes execution replay and debugging tractable.
    </Callout>

    <h2 id="ports">Service ports</h2>
    <table>
      <thead><tr><th>Service</th><th>Port</th><th>Description</th></tr></thead>
      <tbody>
        {[
          ['API Gateway',      '3000', 'HTTP entry point, routes to microservices'],
          ['Pipeline Service', '3001', 'Pipeline CRUD + versioning'],
          ['Execution Service','3002', 'Execution orchestration + heartbeat monitor'],
          ['WebSocket Gateway','3003', 'Real-time log streaming and state updates'],
          ['AI Analyzer',      '3004', 'Failure root cause analysis'],
          ['Notification',     '3005', 'Slack / Discord / webhook alerts'],
          ['GitHub Adapter',   '3006', 'Webhook parser and HMAC verifier'],
          ['Audit Service',    '3007', 'Immutable compliance audit trail'],
          ['Dashboard',        '5173', 'React + Vite frontend (dev)'],
          ['PostgreSQL',       '5433', 'Relational database'],
          ['Redis',            '6379', 'Queue, Event Bus, and cache'],
        ].map(([svc, port, desc]) => (
          <tr key={svc}><td>{svc}</td><td><code>{port}</code></td><td>{desc}</td></tr>
        ))}
      </tbody>
    </table>

  </DocPage>
);

export default ArchitecturePage;
