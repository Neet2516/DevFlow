import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'overview',  text: 'Overview',       level: 2 },
  { id: 'connect',   text: 'Connecting',     level: 2 },
  { id: 'subscribe', text: 'Subscriptions',  level: 2 },
  { id: 'events',    text: 'Event types',    level: 2 },
  { id: 'reconnect', text: 'Reconnection',   level: 2 },
];

const WebSocketApiPage: React.FC = () => (
  <DocPage title="WebSocket API" description="Real-time event streaming for live execution state and log lines." toc={TOC}>

    <h2 id="overview">Overview</h2>
    <p>
      The WebSocket Gateway (port <code>3003</code>) provides room-based subscriptions for live execution state transitions
      and streamed log lines. Clients subscribe to an execution room and receive all events for that execution.
    </p>
    <Callout type="note">
      WebSocket latency target is <strong>&lt; 50ms</strong>. The Gateway reads directly from the Redis Event Stream —
      it does not wait for PostgreSQL writes.
    </Callout>

    <h2 id="connect">Connecting</h2>
    <CodeBlock language="javascript" code={`import { io } from 'socket.io-client';

const socket = io('ws://localhost:3003', {
  auth: { token: 'Bearer <jwt>' },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to DevFlow WebSocket Gateway');
});`} />

    <h2 id="subscribe">Subscriptions</h2>
    <p>Subscribe to an execution room to receive all state and log events for that execution:</p>
    <CodeBlock language="javascript" code={`// Subscribe to an execution
socket.emit('subscribe', { executionId: 'ex_789abc' });

// Unsubscribe when done (e.g., on component unmount)
socket.emit('unsubscribe', { executionId: 'ex_789abc' });`} />
    <p>Room isolation is enforced server-side — client A never receives events from client B's execution.</p>

    <h2 id="events">Event types</h2>
    <p>After subscribing, the gateway pushes the following event types:</p>
    <CodeBlock language="javascript" code={`// Job state change
socket.on('job:stateChange', (event) => {
  // {
  //   executionId: 'ex_789abc',
  //   jobId: 'job_test',
  //   prevStatus: 'running',
  //   status: 'succeeded',
  //   timestamp: '2026-08-11T06:02:30.000Z',
  //   durationMs: 44000
  // }
});

// Log line streamed from worker
socket.on('job:log', (event) => {
  // {
  //   executionId: 'ex_789abc',
  //   jobId: 'job_test',
  //   sequence: 42,
  //   timestamp: '2026-08-11T06:02:01.000Z',
  //   stream: 'stdout',   // or 'stderr'
  //   line: 'PASS src/auth.test.ts (3 tests)'
  // }
});

// Execution-level status change
socket.on('execution:stateChange', (event) => {
  // { executionId: 'ex_789abc', status: 'succeeded', completedAt: '...' }
});

// Worker health update
socket.on('worker:status', (event) => {
  // { workerId: 'worker_build_1', status: 'idle', jobsCompleted: 5 }
});`} />

    <h2 id="reconnect">Reconnection and resume</h2>
    <p>
      The Gateway supports sequence-based resume: if a client reconnects after a brief disconnect,
      it can request all events since its last seen sequence number:
    </p>
    <CodeBlock language="javascript" code={`socket.emit('subscribe', {
  executionId: 'ex_789abc',
  fromSequence: 39,   // replay events from sequence 39 onwards
});`} />
    <Callout type="tip">
      Store the last received <code>sequence</code> in client state. On reconnect, include it in the subscribe
      payload to avoid missing events that occurred during the disconnect window.
    </Callout>

  </DocPage>
);

export default WebSocketApiPage;
