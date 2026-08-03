# 03 — Requirements

## Purpose
Define the functional and non-functional boundaries of DevFlow so architecture decisions in later documents have a fixed target to satisfy.

## Responsibilities
Enumerate what the system must do, how well it must do it, and what is explicitly out of scope for v1.

## Functional Requirements
1. **Pipeline authoring** — create pipelines via drag-and-drop DAG editor; support parallel branches, conditional branching, and per-job retry policy.
2. **Execution** — run pipelines across distributed workers; support Build, Test, Docker, Deploy, and Custom Script job types.
3. **Real-time monitoring** — live status of running/failed jobs, worker health, queue size, execution timeline.
4. **Failure recovery** — automatic retry, manual retry, skip-failed-step, restart-from-failed-node, restart-entire-pipeline.
5. **Log streaming** — worker logs streamed over WebSockets with no manual refresh.
6. **Execution replay** — replay any past execution for debugging, regression analysis, or demo purposes.
7. **Observability dashboard** — pipeline, worker, performance, real-time, and frontend metrics (see `28-monitoring.md`).

## Non-Functional Requirements (Performance Targets)
| Metric | Target |
|---|---|
| Pipeline creation | < 100 ms |
| Graph rendering | 60 FPS |
| WebSocket latency | < 50 ms |
| Pipeline start time | < 200 ms |
| Worker scheduling decision | < 20 ms |
| Event processing throughput | 10,000+ events/min |
| Concurrent pipelines | 500+ |
| Concurrent users | 300+ |
| Worker nodes | 100+ |

## Design Decisions
Performance targets are treated as architectural constraints, not aspirational goals — they directly justify choices such as Redis Streams over a naive polling queue, and viewport-virtualized rendering over naive SVG/DOM graphs (see `15-realtime-dashboard.md`).

## Out of Scope for v1
Multi-tenant orgs, RBAC, audit logs, Kubernetes-native execution, AI failure analysis, mobile dashboard — all deferred to `37-future-improvements.md`.

## Edge Cases
- Requirements assume single-tenant deployment; multi-tenant isolation (noisy-neighbor queues, per-org rate limits) is explicitly deferred.
- No SLA is defined for cross-region worker latency in v1 — single-region deployment assumed.

## Advantages
A tight, explicit non-goals list keeps the v1 build scoped and prevents architecture sprawl.

## Trade-offs
Deferring RBAC/multi-tenancy means the current data model will need a tenant_id migration later — acceptable because retrofitting tenancy into a well-normalized schema is cheaper than over-engineering it upfront.

## Best Practices
Revisit this document at the start of every phase; treat performance targets as regression-tested budgets, not documentation.

## References
`25-performance.md`, `26-scalability.md`, `29-testing-strategy.md`
