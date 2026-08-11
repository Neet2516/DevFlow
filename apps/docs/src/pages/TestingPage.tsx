import React from 'react';
import DocPage from '../components/DocPage';
import Callout from '../components/Callout';
import CodeBlock from '../components/CodeBlock';

const TOC = [
  { id: 'pyramid',   text: 'Test pyramid',     level: 2 },
  { id: 'unit',      text: 'Unit tests',       level: 2 },
  { id: 'integration',text:'Integration tests', level: 2 },
  { id: 'e2e',       text: 'E2E tests',        level: 2 },
  { id: 'chaos',     text: 'Chaos tests',      level: 2 },
];

const TestingPage: React.FC = () => (
  <DocPage title="Testing Strategy" description="Testing pyramid for DevFlow covering unit, integration, E2E, load, and chaos layers." toc={TOC}>

    <h2 id="pyramid">Test pyramid</h2>
    <p>DevFlow has five test layers, from fastest/cheapest (unit) to slowest/most comprehensive (chaos):</p>
    <div className="grid grid-cols-1 gap-3 my-5">
      {[
        { level: '1', name: 'Unit Tests', freq: 'Every commit', desc: 'Pure logic in graph-engine and scheduler packages. No I/O. Table-driven cases including cycles, diamonds, self-references.' },
        { level: '2', name: 'Integration Tests', freq: 'Every commit', desc: 'Real Postgres + Redis (via Docker). Validates that job.completed events correctly update status and unblock downstream nodes.' },
        { level: '3', name: 'E2E Tests', freq: 'Every commit', desc: 'Playwright-driven browser tests: create pipeline → trigger → assert DAG reflects live status changes.' },
        { level: '4', name: 'Load Tests', freq: 'Nightly + pre-release', desc: 'Synthetic load targeting performance targets: 500+ concurrent pipelines, 300+ users, 10K+ events/min.' },
        { level: '5', name: 'Chaos Tests', freq: 'Nightly + pre-release', desc: 'Fault injection: kill worker mid-job, introduce Redis latency, drop WebSocket connections mid-stream.' },
      ].map(({ level, name, freq, desc }) => (
        <div key={level} className="flex gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13161f]">
          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400
                          flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{level}</div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{name}</p>
              <span className="badge badge-blue text-[10px]">{freq}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
          </div>
        </div>
      ))}
    </div>

    <h2 id="unit">Unit tests</h2>
    <CodeBlock terminal language="bash" code={`# Run graph-engine unit tests
npm test -w @devflow/graph-engine

# Run scheduler unit tests
npm test -w @devflow/scheduler`} />
    <p>Test coverage includes:</p>
    <ul>
      <li>Cycle detection: linear chains, simple cycles, complex cycles, self-references</li>
      <li>Diamond DAG readiness counting</li>
      <li>Orphan node detection</li>
      <li>Conditional edge evaluation</li>
      <li>Topological order correctness</li>
    </ul>

    <h2 id="integration">Integration tests</h2>
    <CodeBlock terminal language="bash" code={`# Run full integration suite (requires running infrastructure)
npm run test -w @devflow/tests
# Result: 35 / 35 Tests Passed ✓`} />
    <p>The suite validates:</p>
    <ul>
      <li>DAG cycle detection and validation via API (<code>POST /pipelines</code>)</li>
      <li>Reactive state machine transitions (pending → running → succeeded)</li>
      <li>AI log classification for failure root cause</li>
      <li>GitHub webhook payload parsing and HMAC verification</li>
      <li>Secret redaction in log streams</li>
      <li>DAG version diff (structural comparison)</li>
      <li>Execution cancellation and restart</li>
    </ul>

    <h2 id="e2e">E2E tests</h2>
    <p>Playwright-driven browser tests exercising the full stack. Run with:</p>
    <CodeBlock terminal language="bash" code={`npx playwright test`} />

    <h2 id="chaos">Chaos tests</h2>
    <p>Chaos tests run on a schedule (nightly) and before releases, not on every PR. They exercise:</p>
    <ul>
      <li><strong>Worker kill mid-job</strong> — assert claim-timeout reassignment works correctly.</li>
      <li><strong>Redis latency injection</strong> — assert scheduler concurrency accounting stays correct.</li>
      <li><strong>WebSocket disconnect mid-stream</strong> — assert sequence-based resume recovers cleanly.</li>
      <li><strong>Database unavailability</strong> — assert at-least-once event delivery and idempotent retry.</li>
    </ul>

    <Callout type="tip">
      Every bug fix ships with a regression test reproducing the original failure before the fix — especially
      for chaos/failure-recovery bugs.
    </Callout>

  </DocPage>
);

export default TestingPage;
