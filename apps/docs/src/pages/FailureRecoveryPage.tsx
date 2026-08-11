import React from 'react';
import DocPage from '../components/DocPage';
import Callout from '../components/Callout';

const TOC = [
  { id: 'overview',    text: 'Overview',           level: 2 },
  { id: 'detection',   text: 'Failure detection',  level: 2 },
  { id: 'reassignment',text: 'Job reassignment',   level: 2 },
  { id: 'manual',      text: 'Manual recovery',    level: 2 },
  { id: 'retry-budget',text: 'Retry budget',       level: 2 },
];

const FailureRecoveryPage: React.FC = () => (
  <DocPage title="Failure Recovery" description="Worker failure detection, automatic job reassignment, and manual recovery actions." toc={TOC}>

    <h2 id="overview">Overview</h2>
    <p>
      DevFlow distinguishes between two kinds of failures: <strong>job failures</strong> (the job's code returned
      a non-zero exit code) and <strong>infrastructure failures</strong> (the worker crashed mid-job). These are
      handled by separate mechanisms to avoid burning retry budget on infrastructure problems.
    </p>

    <h2 id="detection">Failure detection</h2>
    <p>
      Worker liveness is detected via <strong>heartbeat monitoring</strong>, not TCP connection state — workers
      may be behind load balancers or NAT where connection state isn't a reliable liveness signal.
    </p>
    <ul>
      <li>Workers emit heartbeats every ~5 seconds.</li>
      <li>A worker is marked <code>offline</code> after 3 consecutive missed intervals (~15s inactivity).</li>
      <li>The liveness monitor publishes a <code>worker.offline</code> event to the Event Bus when this threshold is crossed.</li>
    </ul>

    <Callout type="note">
      Never treat "no heartbeat" as instant failure. Always apply a grace period sized well above normal
      network jitter to avoid false positives on merely-slow workers.
    </Callout>

    <h2 id="reassignment">Automatic job reassignment</h2>
    <p>
      DevFlow leans on Redis Streams' native <strong>consumer-group pending-entries list (PEL)</strong> claim mechanism:
    </p>
    <ol>
      <li>When a worker crashes, its Stream message remains unacknowledged (no <code>XACK</code> sent).</li>
      <li>After the <strong>claim-timeout</strong> elapses, any other worker in the group can call <code>XCLAIM</code> to take ownership.</li>
      <li>The claiming worker re-executes the job as if it were new.</li>
    </ol>

    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-5 font-mono text-xs overflow-x-auto my-5">
      <pre className="text-slate-300 leading-relaxed">{`Worker A (dies)   ──XACK not sent──▶  Redis Stream PEL
                                           │
                              (claim-timeout elapses)
                                           │
Worker B          ◀──────XCLAIM────────────┘
    │
    ▼
  Re-execute job → job.completed → Pipeline Engine unblocks downstream`}</pre>
    </div>

    <h2 id="manual">Manual recovery actions</h2>
    <ul>
      <li><strong>Skip failed step</strong> — mark the <code>JobExecution</code> as <code>skipped</code>, allowing downstream nodes with non-strict dependency policy to proceed.</li>
      <li><strong>Restart from failed node</strong> — creates a new Execution attempt that reuses successful upstream results and re-runs only from the failed node forward.</li>
      <li><strong>Restart entire pipeline</strong> — full new Execution against the same PipelineVersion.</li>
    </ul>

    <h2 id="retry-budget">Retry budget separation</h2>
    <p>
      A job's <code>maxAttempts</code> policy tracks intentional retry budget for <em>job failures</em>.
      Infrastructure-induced failures (worker crash mid-job) are retried transparently up to a separate
      <em>infra-retry</em> budget and do <strong>not</strong> count against <code>maxAttempts</code>.
    </p>
    <p>
      This prevents a flaky worker from consuming all of a job's retries, which would give an incorrect
      signal that the <em>job itself</em> is broken.
    </p>

  </DocPage>
);

export default FailureRecoveryPage;
