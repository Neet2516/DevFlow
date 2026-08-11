import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'worker-types',  text: 'Worker types',     level: 2 },
  { id: 'lifecycle',     text: 'Worker lifecycle',  level: 2 },
  { id: 'heartbeat',     text: 'Heartbeat',         level: 2 },
  { id: 'isolation',     text: 'Job isolation',     level: 2 },
  { id: 'scaling',       text: 'Scaling',           level: 2 },
];

const WorkersPage: React.FC = () => (
  <DocPage title="Worker System" description="How specialized worker runtimes execute jobs safely and reliably." toc={TOC}>

    <h2 id="worker-types">Worker types</h2>
    <p>DevFlow uses specialized worker types instead of a single generic worker. Each type has its own queue, resource profile, and security boundary:</p>
    <table>
      <thead><tr><th>Worker</th><th>Queue</th><th>Job types</th><th>Special privileges</th></tr></thead>
      <tbody>
        {[
          ['build-worker',  'build-queue',  'Compile, bundle, package',     'None — read-only workspace'],
          ['test-worker',   'test-queue',   'Unit, integration, E2E tests', 'None — sandboxed'],
          ['docker-worker', 'docker-queue', 'Image build & push',           'Docker socket access (DinD)'],
          ['deploy-worker', 'deploy-queue', 'Cloud deployments',            'Cloud credentials (scoped)'],
          ['script-worker', 'script-queue', 'Custom bash/shell scripts',    'Configurable per-job'],
        ].map(([w, q, j, p]) => (
          <tr key={w}><td><code>{w}</code></td><td><code>{q}</code></td><td>{j}</td><td>{p}</td></tr>
        ))}
      </tbody>
    </table>

    <Callout type="note">
      A <code>test-worker</code> never has deploy credentials available, even if a test job's script tries to
      request them — scoping is enforced by job type, not by script request.
    </Callout>

    <h2 id="lifecycle">Worker lifecycle</h2>
    <ol>
      <li>Worker starts, registers itself (creates a <code>Worker</code> row, status <code>idle</code>), and joins the Redis Stream consumer group for its job type.</li>
      <li>Worker pulls a <code>JobExecution</code>, publishes <code>job.started</code>, and spawns an isolated executor subprocess.</li>
      <li>Executor streams stdout/stderr line-by-line to the Event Bus log topic as the job runs.</li>
      <li>On completion, worker publishes <code>job.completed</code> or <code>job.failed</code> with exit code/output, acknowledges the Stream message (<code>XACK</code>), and returns to <code>idle</code>.</li>
    </ol>

    <h2 id="heartbeat">Heartbeat mechanism</h2>
    <p>
      Each worker emits a heartbeat every few seconds, updating its <code>lastHeartbeat</code> timestamp in the database.
      The liveness monitor scans for stale heartbeats and marks workers <code>offline</code> after 3 missed intervals (default: 15s inactivity).
    </p>
    <CodeBlock language="typescript" code={`// Simplified heartbeat loop inside a worker
setInterval(async () => {
  await db.worker.update({
    where: { id: workerId },
    data: { lastHeartbeat: new Date(), status: 'active' },
  });
}, HEARTBEAT_INTERVAL_MS); // default: 5000ms`} />

    <h2 id="isolation">Job isolation</h2>
    <p>Every <code>JobExecution</code> runs in an isolated subprocess — never inline in the worker's main event loop. This protects the worker from:</p>
    <ul>
      <li>Runaway processes consuming all CPU or memory</li>
      <li>Malicious user scripts attempting to escape the sandbox</li>
      <li>Uncaught exceptions crashing the worker runtime</li>
    </ul>
    <p>
      Secret values are injected into the subprocess environment only for the duration of the job, then discarded.
      The isolated workspace directory is wiped on job completion (success or failure).
    </p>

    <h2 id="scaling">Scaling workers</h2>
    <p>
      Workers use <strong>pull-based</strong> consumption from Redis Streams consumer groups. Adding worker capacity is as simple as starting more processes — no scheduler-side reconfiguration is needed.
    </p>
    <CodeBlock terminal language="bash" code={`# Scale build workers to 5 instances
npm run dev -w @devflow/build-worker &
npm run dev -w @devflow/build-worker &
npm run dev -w @devflow/build-worker &
# ... etc`} />
    <Callout type="tip">
      In production, use Docker Compose <code>scale</code> or Kubernetes replica sets to manage worker counts.
      Future roadmap includes Kubernetes-native autoscaling based on queue depth.
    </Callout>

  </DocPage>
);

export default WorkersPage;
