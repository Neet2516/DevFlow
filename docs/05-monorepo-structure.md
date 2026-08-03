# 05 — Monorepo Structure

## Purpose
Define how DevFlow's code is organized so that ownership boundaries match architectural boundaries — apps, packages, services, workers, and infrastructure are never tangled together.

## Structure

```
apps/
  dashboard/          # Next.js frontend
  worker/              # generic worker runtime host
  api/                 # Express API gateway

packages/
  shared/              # shared TS types, event schemas, constants
  ui/                  # shared React components (Shadcn-based)
  scheduler/           # scheduling algorithm as an importable library
  graph-engine/        # DAG construction, validation, cycle detection

services/
  auth/                # authentication/session service
  pipeline/            # pipeline CRUD + versioning
  execution/           # execution orchestration (Pipeline Engine)
  websocket/           # WebSocket Gateway
  notification/        # Slack/Discord/email fan-out (future scope)

workers/
  build-worker/
  deploy-worker/
  test-worker/

infrastructure/
  docker/
  nginx/
  monitoring/          # Prometheus/Grafana configs
```

## Responsibilities
- `apps/` — deployable, user-facing surfaces.
- `packages/` — pure, reusable logic with no deployment identity of its own; consumed by both `apps/` and `services/`.
- `services/` — independently deployable backend services, each owning one bounded context.
- `workers/` — job-type-specific execution runtimes, each a thin adapter around `apps/worker`'s generic runtime.
- `infrastructure/` — everything needed to run the system locally or in CI.

## Design Decisions
- **`graph-engine` and `scheduler` live in `packages/`, not `services/`** — they're pure logic with no I/O of their own, which makes them independently unit-testable and reusable by both the `execution` service and, potentially, a future CLI tool.
- **Each worker type is its own package** rather than one monolithic worker with a job-type switch statement — this keeps blast radius small (a bug in `deploy-worker` can't crash `test-worker`) and lets teams own workers independently.

## Internal Components
Managed via a workspace tool (npm/pnpm workspaces or Turborepo) so `packages/shared` type changes propagate to consumers at build time, not silently at runtime.

## Data Flow
`packages/graph-engine` is imported by `services/pipeline` (validation on save) and `services/execution` (validation before run) — one implementation, two call sites, zero drift.

## Advantages
Clear ownership boundaries scale with team size; a new engineer can be handed `workers/test-worker` without needing to understand the Scheduler internals.

## Trade-offs
Monorepo tooling (build caching, dependency graphs) adds setup complexity relative to a single Express app — justified once the system has more than 2–3 deployable units.

## Edge Cases
Circular package dependencies (`shared` importing from `ui`, `ui` importing from `shared`) must be caught by lint rules — this is a common monorepo failure mode.

## Possible Improvements
Turborepo remote caching once CI build times become a bottleneck.

## Best Practices
No service reaches into another service's internals — only through its published API or through `packages/shared` types. `packages/` code has zero knowledge of HTTP, WebSockets, or the database.

## References
`04-tech-stack.md`, `30-folder-structure.md`, `31-coding-guidelines.md`
