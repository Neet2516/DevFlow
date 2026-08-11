import React from 'react';
import DocPage from '../components/DocPage';
import Callout from '../components/Callout';

const TOC = [
  { id: 'frontend', text: 'Frontend',     level: 2 },
  { id: 'backend',  text: 'Backend',      level: 2 },
  { id: 'infra',    text: 'Infrastructure',level: 2 },
  { id: 'decisions',text: 'Key decisions',level: 2 },
];

const TechStackPage: React.FC = () => (
  <DocPage title="Tech Stack" description="Technologies used in each layer and the reasoning behind each choice." toc={TOC}>

    <h2 id="frontend">Frontend</h2>
    <ul>
      <li><strong>React + TypeScript</strong> — component-based UI with full type safety across the stack.</li>
      <li><strong>Vite</strong> — fast HMR development server and optimized production builds.</li>
      <li><strong>React Flow</strong> — purpose-built for node/edge DAG rendering with built-in pan/zoom/minimap; avoids hand-rolling canvas graph logic.</li>
      <li><strong>Tailwind CSS v3</strong> — utility-first styling with a consistent design system; glassmorphic dark-mode UI.</li>
      <li><strong>Framer Motion (motion/react)</strong> — micro-interactions for job-status transitions (pending → running → success/fail).</li>
      <li><strong>Zustand</strong> — lightweight client state (selected node, panel toggles) without Redux boilerplate.</li>
      <li><strong>TanStack Query</strong> — server state, caching, and optimistic updates for REST calls, separate from the real-time WebSocket stream.</li>
    </ul>

    <h2 id="backend">Backend</h2>
    <ul>
      <li><strong>Node.js + Express + TypeScript</strong> — shared language with the frontend, mature ecosystem, straightforward to onboard.</li>
      <li><strong>BullMQ</strong> — Redis-backed job queue with built-in retry, backoff, and rate-limiting; used by the Scheduler to dispatch to workers.</li>
      <li><strong>Redis Streams</strong> — event log for the Event Bus and worker-to-worker coordination; consumer groups map naturally to fan-out needs.</li>
      <li><strong>PostgreSQL + Prisma</strong> — relational integrity for pipelines/jobs/executions; Prisma provides type-safe queries and migrations.</li>
    </ul>

    <h2 id="infra">Infrastructure</h2>
    <ul>
      <li><strong>Docker + Docker Compose</strong> — local dev parity and worker isolation (each job type runs in its own container).</li>
      <li><strong>Nginx</strong> — reverse proxy, TLS termination, WebSocket upgrade handling.</li>
      <li><strong>GitHub Actions</strong> — DevFlow's own CI/CD (dogfooding its own concepts).</li>
      <li><strong>Prometheus + Grafana</strong> — metrics scraping and operational dashboards.</li>
    </ul>

    <h2 id="decisions">Key decisions</h2>

    <Callout type="note" title="Redis Streams over Pub/Sub">
      Streams persist events and support consumer groups with replay. Pub/Sub messages are lost if no consumer is
      listening — unacceptable for a system whose core feature is execution history.
    </Callout>

    <Callout type="note" title="Single-language (TypeScript) stack">
      TypeScript top-to-bottom reduces context switching and enables shared types between frontend and backend
      via <code>packages/shared</code>.
    </Callout>

    <Callout type="warning" title="Node.js single-threaded trade-off">
      Node.js is single-threaded per process. CPU-heavy job execution (large test suites) must run in worker
      subprocesses/containers, never inline — or it will block the event loop.
    </Callout>

    <table>
      <thead><tr><th>Concern</th><th>Solution</th><th>Why</th></tr></thead>
      <tbody>
        {[
          ['Job queueing',    'BullMQ + Redis',     'Built-in retry, backoff, rate-limiting'],
          ['Event fan-out',   'Redis Streams',      'Durable, replayable, consumer groups'],
          ['Database',        'PostgreSQL + Prisma','Relational integrity + type-safe queries'],
          ['Real-time UI',    'WebSockets',         '< 50ms latency target, bidirectional'],
          ['DAG rendering',   'React Flow',         'Pan/zoom/minimap out of the box'],
          ['Containerization','Docker Compose',     'Local dev parity with production'],
        ].map(([c, s, w]) => (
          <tr key={c}><td>{c}</td><td><strong>{s}</strong></td><td>{w}</td></tr>
        ))}
      </tbody>
    </table>

  </DocPage>
);

export default TechStackPage;
