import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'structure',   text: 'Directory structure', level: 2 },
  { id: 'apps',        text: 'apps/',              level: 2 },
  { id: 'packages',    text: 'packages/',           level: 2 },
  { id: 'services',    text: 'services/',           level: 2 },
  { id: 'workers',     text: 'workers/',            level: 2 },
  { id: 'conventions', text: 'Conventions',         level: 2 },
];

const MonorepoPage: React.FC = () => (
  <DocPage title="Monorepo Structure" description="How DevFlow's code is organized across apps, packages, services, and workers." toc={TOC}>

    <h2 id="structure">Directory structure</h2>
    <CodeBlock language="bash" code={`DevFlow/
├── apps/                  # Deployable, user-facing surfaces
│   ├── api/               # API Gateway (:3000)
│   ├── dashboard/         # React + Vite + Tailwind UI (:5173)
│   └── docs/              # This documentation site
│
├── packages/              # Pure, reusable logic — no deployment identity
│   ├── auth/              # JWT middleware & helpers
│   ├── db/                # Prisma client & schema
│   ├── graph-engine/      # DAG construction, cycle detection (Tarjan's)
│   ├── logger/            # Structured logger utility
│   ├── metrics/           # Prometheus metrics collectors
│   ├── scheduler/         # BullMQ queue dispatcher & semaphores
│   ├── shared/            # Shared TypeScript interfaces & types
│   └── templates/         # Pre-built DAG pipeline templates
│
├── services/              # Independently deployable backend microservices
│   ├── ai-analyzer/       # AI failure analyzer (:3004)
│   ├── audit/             # Immutable compliance audit log (:3007)
│   ├── execution/         # Execution orchestration + liveness monitor (:3002)
│   ├── github-adapter/    # GitHub webhook parser (:3006)
│   ├── notification/      # Alert dispatcher (:3005)
│   ├── pipeline/          # Pipeline CRUD + versioning (:3001)
│   └── websocket/         # Real-time WebSocket gateway (:3003)
│
├── workers/               # Job-type-specific execution runtimes
│   ├── build-worker/      # Build queue consumer
│   ├── deploy-worker/     # Deploy queue consumer
│   ├── docker-worker/     # Docker-in-Docker container builder
│   ├── script-worker/     # Custom bash/shell script runner
│   └── test-worker/       # Test runner worker
│
├── tests/                 # Integration & E2E test suite
├── infra/                 # Nginx, Prometheus, Grafana configs
├── docker-compose.yml     # Local development infrastructure
├── docker-compose.prod.yml# Production Docker Compose stack
└── package.json           # Workspace root`} />

    <h2 id="apps">apps/</h2>
    <p>Deployable, user-facing surfaces. Each app has its own <code>package.json</code> and can be started, built, or deployed independently.</p>
    <ul>
      <li><strong>api</strong> — Express API Gateway that routes requests to downstream microservices. Entry point for all HTTP traffic.</li>
      <li><strong>dashboard</strong> — React + Vite + Tailwind CSS single-page application. Uses React Flow for DAG visualization, Framer Motion for animations, and Zustand for local state.</li>
      <li><strong>docs</strong> — This documentation site (React + Vite + Tailwind).</li>
    </ul>

    <h2 id="packages">packages/</h2>
    <p>
      Pure, reusable logic with no deployment identity of their own. Consumed by both <code>apps/</code> and{' '}
      <code>services/</code>.
    </p>

    <Callout type="important" title="Key rule">
      <code>packages/</code> code has <strong>zero knowledge</strong> of HTTP, WebSockets, or the database.
      This is what makes them independently unit-testable without spinning up infrastructure.
    </Callout>

    <ul>
      <li><strong>graph-engine</strong> — DAG construction, validation, Tarjan's cycle detection, topological readiness counting. Pure functions, no I/O.</li>
      <li><strong>scheduler</strong> — BullMQ-backed queue dispatcher with Redis semaphore-based concurrency limits.</li>
      <li><strong>shared</strong> — Shared TypeScript interfaces and event schema types shared across API, workers, and dashboard. The single source of type truth.</li>
      <li><strong>db</strong> — Prisma schema, generated client, and migration files.</li>
      <li><strong>auth</strong> — JWT signing/verification utilities used by the API Gateway and services.</li>
      <li><strong>logger</strong> — Structured JSON logger (wraps a standard logger library) with correlation ID support.</li>
      <li><strong>metrics</strong> — Prometheus metrics registration and collection.</li>
      <li><strong>templates</strong> — Pre-built DAG template definitions for Node.js, Python, Go, and Java Spring Boot pipelines.</li>
    </ul>

    <h2 id="services">services/</h2>
    <p>Independently deployable backend microservices, each owning one bounded context.</p>

    <table>
      <thead><tr><th>Service</th><th>Port</th><th>Responsibility</th></tr></thead>
      <tbody>
        {[
          ['pipeline',       '3001', 'Pipeline CRUD, versioning, template instantiation'],
          ['execution',      '3002', 'Execution orchestration, liveness heartbeat monitor'],
          ['websocket',      '3003', 'Real-time WebSocket log/state streaming gateway'],
          ['ai-analyzer',    '3004', 'Event Bus consumer for AI failure root cause analysis'],
          ['notification',   '3005', 'Slack/Discord/webhook alert dispatching'],
          ['github-adapter', '3006', 'GitHub webhook HMAC verification and event parsing'],
          ['audit',          '3007', 'Immutable compliance audit trail with pagination'],
        ].map(([svc, port, resp]) => (
          <tr key={svc}><td><code>{svc}</code></td><td><code>{port}</code></td><td>{resp}</td></tr>
        ))}
      </tbody>
    </table>

    <h2 id="workers">workers/</h2>
    <p>
      Each worker type is its own npm workspace package — a thin adapter around the generic worker runtime.
      This means a bug in <code>deploy-worker</code> can't crash <code>test-worker</code>, and teams can own workers independently.
    </p>
    <ul>
      <li><strong>build-worker</strong> — Consumes <code>build-queue</code>, runs build commands in isolated subprocesses.</li>
      <li><strong>test-worker</strong> — Consumes <code>test-queue</code>, runs test suites and reports results.</li>
      <li><strong>docker-worker</strong> — Consumes <code>docker-queue</code>, builds and pushes Docker images (Docker-in-Docker).</li>
      <li><strong>deploy-worker</strong> — Consumes <code>deploy-queue</code>, handles cloud deployments with scoped credentials.</li>
      <li><strong>script-worker</strong> — Consumes <code>script-queue</code>, runs arbitrary bash/shell scripts in sandboxed environments.</li>
    </ul>

    <h2 id="conventions">Conventions</h2>
    <ul>
      <li>No service reaches into another service's internals — only through its published API or through <code>packages/shared</code> types.</li>
      <li>Circular package dependencies are caught by lint rules — a common monorepo failure mode.</li>
      <li>All workspace packages are named <code>@devflow/&lt;name&gt;</code>.</li>
      <li>Pin dependency versions; keep <code>packages/shared</code> as the single source of truth for inter-service types.</li>
    </ul>

  </DocPage>
);

export default MonorepoPage;
