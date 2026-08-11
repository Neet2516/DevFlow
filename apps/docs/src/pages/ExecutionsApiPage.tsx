import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'trigger',  text: 'Trigger execution',  level: 2 },
  { id: 'get',      text: 'Get execution',      level: 2 },
  { id: 'cancel',   text: 'Cancel',             level: 2 },
  { id: 'restart',  text: 'Restart',            level: 2 },
  { id: 'export',   text: 'Export logs',        level: 2 },
  { id: 'analytics',text: 'Performance analytics', level: 2 },
];

const ExecutionsApiPage: React.FC = () => (
  <DocPage title="Executions API" description="Endpoints for triggering, monitoring, and controlling pipeline executions." toc={TOC}>

    <h2 id="trigger">Trigger execution</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-post">POST</span>
      <code className="text-sm">/api/v1/pipelines/:id/executions</code>
    </div>
    <p>
      Triggers a new execution of the latest version of the specified pipeline. Returns{' '}
      <code>202 Accepted</code> — execution is async; subscribe to WebSocket for live state.
    </p>
    <CodeBlock language="json" filename="Response 202" code={`{
  "executionId": "ex_789abc",
  "pipelineId": "pl_abc123",
  "status": "pending",
  "triggeredAt": "2026-08-11T06:01:00.000Z"
}`} />

    <Callout type="note">
      <code>202 Accepted</code> means the execution has been accepted and queued — not that it has started or completed.
      Use the WebSocket room for live updates.
    </Callout>

    <h2 id="get">Get execution status</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-get">GET</span>
      <code className="text-sm">/api/v1/executions/:id</code>
    </div>
    <CodeBlock language="json" filename="Response 200" code={`{
  "id": "ex_789abc",
  "pipelineId": "pl_abc123",
  "status": "running",
  "startedAt": "2026-08-11T06:01:05.000Z",
  "jobs": [
    {
      "id": "job_build",
      "name": "Build",
      "status": "succeeded",
      "startedAt": "2026-08-11T06:01:06.000Z",
      "completedAt": "2026-08-11T06:01:45.000Z",
      "durationMs": 39000,
      "workerId": "worker_build_1"
    },
    {
      "id": "job_test",
      "name": "Test",
      "status": "running",
      "startedAt": "2026-08-11T06:01:47.000Z",
      "completedAt": null
    },
    {
      "id": "job_deploy",
      "name": "Deploy",
      "status": "pending",
      "startedAt": null
    }
  ]
}`} />

    <h2 id="cancel">Cancel execution</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-post">POST</span>
      <code className="text-sm">/api/v1/executions/:id/cancel</code>
    </div>
    <p>Cancels a running or pending execution. In-progress jobs are allowed to complete their current task before workers stop polling.</p>
    <CodeBlock language="json" filename="Response 200" code={`{ "status": "cancelled", "cancelledAt": "2026-08-11T06:02:00.000Z" }`} />

    <h2 id="restart">Restart execution</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-post">POST</span>
      <code className="text-sm">/api/v1/executions/:id/restart</code>
    </div>
    <CodeBlock language="json" filename="Request body" code={`{
  "mode": "failed-node"
}
// OR
{
  "mode": "entire-pipeline"
}`} />
    <p>Modes:</p>
    <ul>
      <li><code>"failed-node"</code> — creates a new Execution that reuses successful upstream results and re-runs only from the first failed node forward.</li>
      <li><code>"entire-pipeline"</code> — full new Execution against the same PipelineVersion from scratch.</li>
    </ul>

    <h2 id="export">Export logs</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-get">GET</span>
      <code className="text-sm">/api/v1/executions/:id/logs/export?format=json</code>
    </div>
    <p>Exports all captured log lines for the execution as <code>txt</code> or <code>json</code>. Secrets are redacted in exported logs.</p>

    <h2 id="analytics">Performance analytics</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-get">GET</span>
      <code className="text-sm">/api/v1/analytics/performance</code>
    </div>
    <CodeBlock language="json" filename="Response 200" code={`{
  "throughput": { "executionsPerMin": 12, "jobsPerMin": 47 },
  "successRate": 0.94,
  "activeWorkers": 8,
  "queueDepths": {
    "build-queue": 3,
    "test-queue": 11,
    "deploy-queue": 0
  },
  "p50DurationMs": 12000,
  "p95DurationMs": 45000,
  "p99DurationMs": 120000
}`} />

  </DocPage>
);

export default ExecutionsApiPage;
