import React from 'react';
import DocPage from '../components/DocPage';
import Callout from '../components/Callout';

const TOC = [
  { id: 'functional', text: 'Functional requirements', level: 2 },
  { id: 'nonfunctional', text: 'Performance targets', level: 2 },
  { id: 'out-of-scope', text: 'Out of scope (v1)', level: 2 },
];

const RequirementsPage: React.FC = () => (
  <DocPage title="Requirements" description="Functional requirements and performance targets for DevFlow v1." toc={TOC}>

    <h2 id="functional">Functional requirements</h2>
    <ol>
      <li><strong>Pipeline authoring</strong> — create pipelines via drag-and-drop DAG editor; support parallel branches, conditional branching, and per-job retry policy.</li>
      <li><strong>Execution</strong> — run pipelines across distributed workers; support Build, Test, Docker, Deploy, and Custom Script job types.</li>
      <li><strong>Real-time monitoring</strong> — live status of running/failed jobs, worker health, queue size, execution timeline.</li>
      <li><strong>Failure recovery</strong> — automatic retry, manual retry, skip-failed-step, restart-from-failed-node, restart-entire-pipeline.</li>
      <li><strong>Log streaming</strong> — worker logs streamed over WebSockets with no manual refresh.</li>
      <li><strong>Execution replay</strong> — replay any past execution for debugging, regression analysis, or demo purposes.</li>
      <li><strong>Observability dashboard</strong> — pipeline, worker, performance, real-time, and frontend metrics.</li>
    </ol>

    <h2 id="nonfunctional">Performance targets</h2>
    <Callout type="note">
      These targets are treated as <strong>architectural constraints</strong>, not aspirational goals — they directly
      justify technology choices like Redis Streams over naive polling queues.
    </Callout>
    <table>
      <thead><tr><th>Metric</th><th>Target</th></tr></thead>
      <tbody>
        {[
          ['Pipeline creation',        '< 100 ms'],
          ['Graph rendering',          '60 FPS'],
          ['WebSocket latency',        '< 50 ms'],
          ['Pipeline start time',      '< 200 ms'],
          ['Scheduling decision',      '< 20 ms'],
          ['Event throughput',         '10,000+ events/min'],
          ['Concurrent pipelines',     '500+'],
          ['Concurrent users',         '300+'],
          ['Worker nodes',             '100+'],
        ].map(([metric, target]) => (
          <tr key={metric}><td>{metric}</td><td><strong>{target}</strong></td></tr>
        ))}
      </tbody>
    </table>

    <h2 id="out-of-scope">Out of scope (v1)</h2>
    <p>The following features are explicitly deferred to future milestones:</p>
    <ul>
      <li>Multi-tenant organizations and per-org isolation</li>
      <li>Role-Based Access Control (RBAC)</li>
      <li>Kubernetes-native worker pools with autoscaling</li>
      <li>Mobile dashboard</li>
      <li>Cross-region worker latency SLAs</li>
    </ul>
    <Callout type="note">
      A tight, explicit non-goals list keeps v1 scoped and prevents architecture sprawl. See the{' '}
      <a href="/docs/roadmap">Roadmap</a> for what's planned next.
    </Callout>

  </DocPage>
);

export default RequirementsPage;
