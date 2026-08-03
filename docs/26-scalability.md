# 26 — Scalability

## Purpose
Describe how each component scales horizontally as load grows beyond the v1 targets, and where the current architecture's ceilings are.

## Responsibilities
Identify the scaling unit for each component and the signal that indicates it's time to scale.

## Scaling Model by Component
- **Pipeline Engine** — stateless, scales by adding instances behind the API layer; signal to scale: engine CPU or scheduling-decision latency approaching the 20ms budget.
- **Scheduler** — stateless, scales identically to the Engine; shared Redis semaphores keep concurrency accounting correct across instances.
- **Workers** — the primary scale-out dimension; add worker processes per job type based on per-type queue depth (`17-queue-system.md`). This is the component most directly proportional to actual pipeline volume.
- **WebSocket Gateway** — scales by adding instances, each independently a Redis Streams consumer group member; a load balancer with sticky-less (sequence-resume) reconnect distributes client connections.
- **Redis (Queue + Event Bus)** — the first likely bottleneck at very high scale, since both BullMQ and Streams share one instance in v1. Signal to act: sustained memory pressure or command latency increase. Mitigation path: split into separate Redis instances (Queue vs. Event Bus), then Redis Cluster if a single instance's throughput ceiling is reached.
- **PostgreSQL** — read replicas for dashboard/history queries once write load on the primary (from Event-driven DB writes) competes with read query latency; partition `Execution`/`JobExecution` by time once table size affects index performance.

## Design Decisions
- **Every control-plane component (Engine, Scheduler, Gateway) is designed stateless from day one** specifically so scaling is "add another instance," never "redesign for statelessness under load" — this was called out explicitly in `09-workflow-engine.md` and `14-websocket-architecture.md` as an upfront investment, not a later refactor.
- **Redis is the acknowledged near-term ceiling**, addressed with a clear, incremental migration path (split instances → Cluster → Kafka evaluation) rather than pre-building for a scale the system doesn't yet need.

## Advantages
Because control-plane statelessness was a v1 decision, scaling to the next order of magnitude of load is primarily an infrastructure/ops exercise (add instances, split Redis), not an application rewrite.

## Trade-offs
Deferring Kafka/multi-Redis until signals appear means a rushed migration is possible under sudden load spikes — mitigated by proactively monitoring the specific signals listed above (`28-monitoring.md`) well before they become incidents.

## Edge Cases
A sudden burst (e.g., a monorepo-wide CI trigger fanning out hundreds of pipelines at once) stresses the Scheduler's semaphore accounting and Queue ingestion simultaneously — load testing (`29-testing-strategy.md`) explicitly targets this "thundering herd" scenario, not just steady-state throughput.

## Possible Improvements
Multi-region worker pools for geographically distributed teams; Kafka migration for the Event Bus once Redis Streams throughput is the binding constraint.

## Best Practices
Never hardcode instance counts or connection pool sizes — every scalable component reads its concurrency/pool configuration from environment, enabling scale changes without code changes.

## References
`25-performance.md`, `17-queue-system.md`, `07-database-design.md`
