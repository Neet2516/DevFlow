# 04 — Tech Stack

## Purpose
Document the chosen technologies for each layer of DevFlow and the reasoning behind each choice, so future contributors understand *why*, not just *what*.

## Frontend
- **Next.js + React + TypeScript** — SSR/SSG for the marketing/auth shell, client-heavy rendering for the dashboard itself.
- **React Flow** — purpose-built for node/edge DAG rendering with built-in pan/zoom/minimap; avoids hand-rolling canvas graph logic.
- **TailwindCSS + Shadcn UI** — utility-first styling with accessible, composable primitives; keeps design system consistent without a heavy custom component library.
- **Framer Motion** — micro-interactions for job-status transitions (pending → running → success/fail).
- **Zustand** — lightweight client state (UI state, selected node, panel toggles) without Redux boilerplate.
- **TanStack Query** — server state, caching, and optimistic updates for REST calls (pipeline CRUD), separate from the real-time WebSocket stream.

## Backend
- **Node.js + Express + TypeScript** — shared language with frontend, mature ecosystem, straightforward to hire/onboard for.
- **BullMQ** — Redis-backed job queue with built-in retry, backoff, and rate-limiting primitives; used by the Scheduler to dispatch to workers.
- **Redis Streams** — event log for the Event Bus and worker-to-worker coordination; consumer groups map naturally onto our fan-out needs.
- **PostgreSQL + Prisma** — relational integrity for pipelines/jobs/executions (foreign keys matter here — a job without a valid pipeline is a data bug); Prisma gives type-safe queries and migrations.

## Infrastructure
- **Docker + Docker Compose** — local dev parity and worker isolation (each job type can run in its own container).
- **Nginx** — reverse proxy, TLS termination, WebSocket upgrade handling.
- **GitHub Actions** — DevFlow's own CI/CD (dogfooding).
- **Prometheus + Grafana** — metrics scraping and dashboards for the metrics enumerated in `28-monitoring.md`.

## Communication
- **WebSockets** — primary channel for live dashboard updates.
- **Server-Sent Events** — fallback/alternative for simpler one-way log streaming where full-duplex isn't needed.
- **Redis Pub/Sub** — lightweight fan-out for ephemeral signals (e.g., "worker joined") that don't need Stream durability.

## Design Decisions
- Redis Streams over plain Pub/Sub for the Event Bus specifically *because* Streams persist and support consumer groups with replay — Pub/Sub messages are lost if no one's listening, which is unacceptable for a system whose core feature is execution history.
- Prisma over a raw query builder for developer velocity and migration safety, accepting a small runtime overhead as a worthwhile trade for correctness.

## Advantages
Single-language (TypeScript) stack top-to-bottom reduces context switching and enables shared types between frontend and backend via a `packages/shared` package.

## Trade-offs
Node.js is single-threaded per process — CPU-heavy job execution (e.g., large test suites) must be isolated in worker subprocesses/containers rather than run inline, or it will block the event loop.

## Edge Cases
Redis is a single point of failure for both the Queue and Event Bus unless deployed with Sentinel/Cluster — production deployments must not run Redis as a single unmanaged instance.

## Possible Improvements
Evaluate Kafka as an alternative Event Bus backend once event volume exceeds what a single Redis instance can comfortably serve (see `26-scalability.md`).

## Best Practices
Pin dependency versions; keep `packages/shared` as the single source of truth for types shared between API, worker, and dashboard.

## References
`05-monorepo-structure.md`, `13-event-bus.md`, `17-queue-system.md`
