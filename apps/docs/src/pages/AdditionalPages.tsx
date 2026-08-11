import React from 'react';
import DocPage from '../components/DocPage';
import Callout from '../components/Callout';
import CodeBlock from '../components/CodeBlock';

// ── Event Bus ──────────────────────────────────────────────
export const EventBusPage: React.FC = () => (
  <DocPage title="Event Bus" description="The Redis Streams-based integration backbone for all state transitions in DevFlow." toc={[
    { id: 'overview',   text: 'Overview',        level: 2 },
    { id: 'streams',    text: 'Redis Streams',   level: 2 },
    { id: 'topics',     text: 'Topics',          level: 2 },
    { id: 'consumers',  text: 'Consumer groups', level: 2 },
  ]}>
    <h2 id="overview">Overview</h2>
    <p>The Event Bus is the integration backbone of DevFlow. Every meaningful state transition — job started, job completed, worker offline — is published here, and every other subsystem consumes from it independently.</p>
    <Callout type="note">This decoupling means adding a new consumer (e.g., AI Failure Analyzer) requires zero changes to existing producers. It's "just another consumer group."</Callout>

    <h2 id="streams">Why Redis Streams (not Pub/Sub)</h2>
    <ul>
      <li><strong>Streams persist events</strong> — a consumer that's briefly offline can resume from where it left off.</li>
      <li><strong>Consumer groups</strong> — multiple independent consumers can read the same stream without competing.</li>
      <li><strong>At-least-once delivery</strong> — unacknowledged messages stay in the pending-entries list (PEL) for retry.</li>
    </ul>
    <p>Redis Pub/Sub messages are lost if no consumer is listening — unacceptable for a system whose core feature is execution history.</p>

    <h2 id="topics">Topics (streams)</h2>
    <table>
      <thead><tr><th>Stream</th><th>Producer</th><th>Events</th></tr></thead>
      <tbody>
        {[
          ['job-events', 'Workers', 'job.started, job.completed, job.failed, job.log'],
          ['pipeline-events', 'Pipeline Engine', 'execution.started, execution.completed, execution.cancelled'],
          ['worker-events', 'Liveness Monitor', 'worker.online, worker.offline'],
        ].map(([s, p, e]) => (
          <tr key={s}><td><code>{s}</code></td><td>{p}</td><td>{e}</td></tr>
        ))}
      </tbody>
    </table>

    <h2 id="consumers">Consumer groups</h2>
    <p>Each consumer is its own Redis consumer group on the <code>job-events</code> stream:</p>
    <ul>
      <li><strong>db-writer</strong> — persists state changes to PostgreSQL (durability).</li>
      <li><strong>ws-gateway</strong> — pushes deltas to connected dashboard clients.</li>
      <li><strong>scheduler</strong> — reacts to job completions to unlock downstream nodes.</li>
      <li><strong>notifier</strong> — sends Slack/Discord alerts on completion or failure.</li>
      <li><strong>ai-analyzer</strong> — parses failure logs for root cause analysis.</li>
    </ul>
    <CodeBlock language="bash" code={`# All events flow through one XADD call — consumers are independent:
XADD job-events * type job.completed executionId ex_789 jobId job_test status succeeded`} />
  </DocPage>
);

// ── AI Analyzer ──────────────────────────────────────────
export const AiAnalyzerPage: React.FC = () => (
  <DocPage title="AI Failure Analyzer" description="Event Bus consumer that parses job failure logs to produce root-cause analysis." toc={[
    { id: 'overview',  text: 'Overview',   level: 2 },
    { id: 'how',       text: 'How it works',level: 2 },
    { id: 'api',       text: 'API',        level: 2 },
  ]}>
    <h2 id="overview">Overview</h2>
    <p>
      The AI Failure Analyzer is a standalone microservice (port 3004) that subscribes to the <code>job-events</code>{' '}
      stream as a consumer group. When a <code>job.failed</code> event arrives, it fetches the job's log output
      and analyzes it to produce a root-cause summary and automated fix recommendations.
    </p>
    <Callout type="note" title="New feature">
      The AI Analyzer is a v1 feature. It runs as an independent consumer and adds zero latency to the
      execution critical path — if it's down, executions continue normally.
    </Callout>

    <h2 id="how">How it works</h2>
    <ol>
      <li>Subscribes to <code>job-events</code> stream via Redis consumer group <code>ai-analyzer</code>.</li>
      <li>On <code>job.failed</code> events, fetches the full log output for the <code>jobExecutionId</code>.</li>
      <li>Runs log classification: identifies error signatures, stack traces, OOM patterns, test failures.</li>
      <li>Produces a structured analysis object stored in the database and associated with the <code>JobExecution</code>.</li>
    </ol>

    <h2 id="api">API endpoint</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-get">GET</span>
      <code className="text-sm">/api/v1/executions/:id/analysis</code>
    </div>
    <CodeBlock language="json" filename="Response 200" code={`{
  "executionId": "ex_789abc",
  "jobId": "job_test",
  "rootCause": "Jest test suite exceeded memory limit (512MB). 47 of 50 tests passed.",
  "failedTests": ["auth.integration.spec.ts:line 142"],
  "recommendations": [
    "Increase worker memory limit to 1024MB for test-worker",
    "Split large test suites into parallel shards"
  ],
  "confidence": 0.87,
  "analyzedAt": "2026-08-11T06:05:00.000Z"
}`} />
  </DocPage>
);

// ── Docker page ───────────────────────────────────────────
export const DockerPage: React.FC = () => (
  <DocPage title="Docker & Compose" description="Containerization and local/production deployment with Docker Compose." toc={[
    { id: 'local',   text: 'Local development', level: 2 },
    { id: 'prod',    text: 'Production stack',  level: 2 },
    { id: 'images',  text: 'Docker images',     level: 2 },
  ]}>
    <h2 id="local">Local development</h2>
    <p>Start PostgreSQL and Redis for local development:</p>
    <CodeBlock terminal language="bash" code={`docker-compose up -d`} />
    <CodeBlock filename="docker-compose.yml (excerpt)" language="yml" code={`services:
  postgres:
    image: postgres:16-alpine
    ports: ["5433:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: devflow

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]`} />

    <h2 id="prod">Production stack</h2>
    <p>The production stack adds Nginx (reverse proxy + TLS), Prometheus, Grafana, and all services:</p>
    <CodeBlock terminal language="bash" code={`docker-compose -f docker-compose.prod.yml up -d`} />
    <p>Nginx routes:</p>
    <ul>
      <li><code>/ws</code> → WebSocket Gateway (port 3003) with upgrade handling</li>
      <li><code>/api</code> → API Gateway (port 3000)</li>
      <li><code>/</code> → Dashboard (port 5173 → 80)</li>
    </ul>

    <h2 id="images">Docker images</h2>
    <p>Each deployable unit has its own multi-stage Dockerfile:</p>
    <ul>
      <li><code>apps/dashboard.Dockerfile</code> — Vite build → Nginx static serve</li>
      <li><code>apps/api.Dockerfile</code> — Node.js API Gateway</li>
      <li><code>workers/build-worker.Dockerfile</code> — Build worker runtime</li>
      <li><code>workers/deploy-worker.Dockerfile</code> — Deploy worker (includes cloud CLIs)</li>
    </ul>
    <Callout type="tip">
      Every image is tagged with the Git SHA, never <code>latest</code>, so deployments are always traceable
      to an exact commit.
    </Callout>
  </DocPage>
);

// ── Domain model ─────────────────────────────────────────
export const DomainModelPage: React.FC = () => (
  <DocPage title="Domain Model" description="Core entities and their relationships in DevFlow." toc={[
    { id: 'entities',  text: 'Core entities',  level: 2 },
    { id: 'relationships', text: 'Relationships', level: 2 },
  ]}>
    <h2 id="entities">Core entities</h2>
    <table>
      <thead><tr><th>Entity</th><th>Description</th></tr></thead>
      <tbody>
        {[
          ['Pipeline',       'A named, versioned definition of a DAG of jobs. Immutable once execution starts.'],
          ['PipelineVersion','A specific snapshot of a Pipeline\'s DAG. Executions reference a version, not the live Pipeline.'],
          ['Execution',      'A single run of a PipelineVersion. Has status and a timeline of JobExecutions.'],
          ['Job',            'A node definition within a Pipeline (type, retry policy, dependencies).'],
          ['JobExecution',   'A single run of a Job within an Execution. The unit dispatched to a Worker.'],
          ['Worker',         'A registered execution node. Has health status, capacity, and assigned JobExecutions.'],
          ['Event',          'An immutable record of a state transition flowing through the Event Bus.'],
        ].map(([e, d]) => (
          <tr key={e}><td><strong>{e}</strong></td><td>{d}</td></tr>
        ))}
      </tbody>
    </table>

    <h2 id="relationships">Key design decisions</h2>
    <ul>
      <li><strong>PipelineVersion is a first-class entity</strong>, not a mutable field. This makes execution replay meaningful — replaying an old Execution uses the DAG as it existed at that time.</li>
      <li><strong>JobExecution, not Job, is what a Worker executes.</strong> Job is the template; JobExecution is the instance with its own status, logs, retry count, and timing.</li>
      <li>Deleting a Pipeline with historical Executions uses soft-delete — never hard-delete — to preserve audit/replay integrity.</li>
    </ul>
  </DocPage>
);

// ── State machine ─────────────────────────────────────────
export const StateMachinePage: React.FC = () => (
  <DocPage title="State Machine" description="Execution and JobExecution state transitions in DevFlow." toc={[
    { id: 'job-states',      text: 'Job states',       level: 2 },
    { id: 'execution-states',text: 'Execution states', level: 2 },
  ]}>
    <h2 id="job-states">JobExecution states</h2>
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-5 font-mono text-xs overflow-x-auto my-5">
      <pre className="text-slate-300 leading-relaxed">{`
pending ──► running ──► succeeded
                │
                ├──► failed ──► (retry) ──► running
                │                 │
                │                 └──► failed (exhausted)
                │
                └──► cancelled
                └──► skipped`}</pre>
    </div>
    <table>
      <thead><tr><th>State</th><th>Meaning</th></tr></thead>
      <tbody>
        {[
          ['pending',   'Waiting for dependencies to resolve'],
          ['running',   'Actively executing on a worker'],
          ['succeeded', 'Completed with exit code 0'],
          ['failed',    'Completed with non-zero exit code or worker crash'],
          ['cancelled', 'Cancelled by user action before completion'],
          ['skipped',   'Bypassed by conditional edge or user skip action'],
        ].map(([s, m]) => (
          <tr key={s}><td><code>{s}</code></td><td>{m}</td></tr>
        ))}
      </tbody>
    </table>

    <h2 id="execution-states">Execution states</h2>
    <p>An Execution status is derived from the aggregate of its JobExecution statuses:</p>
    <ul>
      <li><code>pending</code> — created, waiting for root nodes to be enqueued</li>
      <li><code>running</code> — at least one JobExecution is running</li>
      <li><code>succeeded</code> — all JobExecutions reached a terminal success or skip state</li>
      <li><code>failed</code> — at least one JobExecution failed and exhausted retries</li>
      <li><code>cancelled</code> — cancelled by user action</li>
    </ul>
    <Callout type="note">
      Status changes only happen as a side effect of consuming an Event — never via direct mutation.
      This keeps the event log and the row-level status provably consistent.
    </Callout>
  </DocPage>
);

// ── Scheduler ─────────────────────────────────────────────
export const SchedulerPage: React.FC = () => (
  <DocPage title="Scheduler" description="BullMQ-backed queue dispatcher with Redis semaphore concurrency control." toc={[
    { id: 'role',      text: 'Role',             level: 2 },
    { id: 'bullmq',    text: 'BullMQ queues',    level: 2 },
    { id: 'concurrency',text:'Concurrency limits',level: 2 },
  ]}>
    <h2 id="role">Role</h2>
    <p>
      The Scheduler (in <code>packages/scheduler</code>) is the bridge between the Pipeline Engine and the Worker Nodes.
      When the Engine determines a node is ready, it asks the Scheduler to enqueue that node's JobExecution.
    </p>

    <h2 id="bullmq">BullMQ queues</h2>
    <p>Each worker type has its own BullMQ queue backed by Redis:</p>
    <ul>
      <li><code>build-queue</code> → build-worker consumers</li>
      <li><code>test-queue</code> → test-worker consumers</li>
      <li><code>docker-queue</code> → docker-worker consumers</li>
      <li><code>deploy-queue</code> → deploy-worker consumers</li>
      <li><code>script-queue</code> → script-worker consumers</li>
    </ul>
    <p>BullMQ provides built-in retry, exponential backoff, and rate-limiting primitives on top of Redis.</p>

    <h2 id="concurrency">Concurrency limits</h2>
    <p>
      Redis semaphores enforce per-execution and global concurrency limits. This prevents a single
      large execution from starving other pipelines by consuming all available workers.
    </p>
    <Callout type="note">
      The Scheduler's scheduling decision budget target is <strong>&lt; 20ms</strong>. The DAG structure
      (immutable per PipelineVersion) is cached; only mutable execution status is re-read.
    </Callout>
  </DocPage>
);

// ── Observability ─────────────────────────────────────────
export const ObservabilityPage: React.FC = () => (
  <DocPage title="Observability" description="Metrics, monitoring, and operational visibility for the DevFlow platform." toc={[
    { id: 'metrics',  text: 'Prometheus metrics', level: 2 },
    { id: 'grafana',  text: 'Grafana dashboards', level: 2 },
    { id: 'logging',  text: 'Structured logging', level: 2 },
  ]}>
    <h2 id="metrics">Prometheus metrics</h2>
    <p>The <code>packages/metrics</code> package registers Prometheus counters and histograms across all services:</p>
    <table>
      <thead><tr><th>Metric</th><th>Type</th><th>Description</th></tr></thead>
      <tbody>
        {[
          ['devflow_executions_total',        'Counter',   'Total executions by status'],
          ['devflow_job_duration_ms',         'Histogram', 'Job execution duration in ms'],
          ['devflow_queue_depth',             'Gauge',     'Current queue depth per worker type'],
          ['devflow_active_workers',          'Gauge',     'Number of active (non-offline) workers'],
          ['devflow_event_throughput',        'Counter',   'Events processed per second'],
          ['devflow_ws_connections_active',   'Gauge',     'Active WebSocket connections'],
        ].map(([m, t, d]) => (
          <tr key={m}><td><code className="text-xs">{m}</code></td><td>{t}</td><td>{d}</td></tr>
        ))}
      </tbody>
    </table>
    <p>Prometheus scrapes metrics from each service at <code>/metrics</code>.</p>

    <h2 id="grafana">Grafana dashboards</h2>
    <p>Pre-configured dashboards are in <code>infra/monitoring/grafana/</code>:</p>
    <ul>
      <li><strong>Pipeline Overview</strong> — execution throughput, success rates, average duration</li>
      <li><strong>Worker Health</strong> — active workers, queue depth per type, offline events</li>
      <li><strong>Performance</strong> — p50/p95/p99 job duration, scheduling latency</li>
      <li><strong>Real-time</strong> — WebSocket connection count, event throughput</li>
    </ul>

    <h2 id="logging">Structured logging</h2>
    <p>
      All services use the <code>@devflow/logger</code> package for structured JSON logging with correlation
      IDs (<code>pipelineId</code>, <code>executionId</code>, <code>jobId</code>) on every log line.
    </p>
    <CodeBlock language="json" filename="Log line (JSON)" code={`{
  "level": "info",
  "message": "Job completed",
  "pipelineId": "pl_abc123",
  "executionId": "ex_789abc",
  "jobId": "job_test",
  "durationMs": 44000,
  "timestamp": "2026-08-11T06:02:30.000Z"
}`} />
  </DocPage>
);

// ── Roadmap ───────────────────────────────────────────────
export const RoadmapPage: React.FC = () => (
  <DocPage title="Roadmap" description="Future improvements and planned features for DevFlow." toc={[
    { id: 'v1',  text: 'v1 — Shipped',  level: 2 },
    { id: 'v2',  text: 'v2 — Planned',  level: 2 },
  ]}>
    <h2 id="v1">v1 — Shipped</h2>
    <ul>
      {[
        'DAG workflow engine with cycle detection',
        'Distributed worker runtime (5 types)',
        'Real-time WebSocket monitoring dashboard',
        'Automated secret redaction in logs',
        'AI failure root cause analyzer',
        'GitHub webhook integration',
        'Slack/Discord notification service',
        'Compliance audit trail',
        'Pipeline templates (Node.js, Python, Go, Java)',
        'Docker Compose production stack',
        '35/35 integration tests passing',
      ].map(f => <li key={f}>{f}</li>)}
    </ul>

    <h2 id="v2">v2 — Planned</h2>
    <ul>
      {[
        'Multi-tenant organizations with per-org isolation',
        'Role-Based Access Control (RBAC)',
        'Kubernetes-native worker pools with autoscaling based on queue depth',
        'Priority-aware scheduling for pipeline preemption',
        'Kafka as alternative Event Bus backend for very high throughput',
        'Mobile dashboard (React Native)',
        'Per-pipeline secret scoping with approval workflow',
        'Dynamic sub-DAGs (fan-out over runtime-computed lists)',
        'Turborepo remote caching for faster CI builds',
        'Property-based testing for graph-engine',
      ].map(f => <li key={f}>{f}</li>)}
    </ul>
  </DocPage>
);

// ── License ───────────────────────────────────────────────
export const LicensePage: React.FC = () => (
  <DocPage title="License" description="DevFlow is distributed under the MIT License." toc={[]}>
    <p>DevFlow is open source software distributed under the <strong>MIT License</strong>.</p>
    <CodeBlock language="bash" code={`MIT License

Copyright (c) 2026 DevFlow Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.`} />
    <p>
      See the full <a href="https://github.com/Neet2516/DevFlow/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">LICENSE</a> file in the repository.
    </p>
  </DocPage>
);
