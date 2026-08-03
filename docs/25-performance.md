# 25 — Performance

## Purpose
Explain how each performance target from `03-requirements.md` is actually achieved architecturally, tying the target to the specific design decision that satisfies it.

## Target-to-Design Mapping
| Target | Primary mechanism |
|---|---|
| Pipeline creation < 100ms | Synchronous validation only does in-memory cycle detection (`10-dag-execution.md`); persistence is a single indexed insert. |
| Graph rendering 60 FPS | Viewport virtualization + per-node memoized selectors (`15-realtime-dashboard.md`, `35-component-diagrams.md`). |
| WebSocket latency < 50ms | Room-based filtering avoids broadcast overhead; Gateway is a dedicated, horizontally-scaled service (`14-websocket-architecture.md`). |
| Pipeline start time < 200ms | Stateless Engine reads cached DAG structure, Scheduler uses Redis semaphores not DB locks (`09-workflow-engine.md`, `12-scheduler.md`). |
| Worker scheduling < 20ms | Redis-backed concurrency semaphores, no synchronous cross-service RPC in the hot path (`12-scheduler.md`). |
| 10,000+ events/min | Redis Streams consumer groups scale horizontally with Gateway/DB-writer instance count (`13-event-bus.md`). |
| 500+ concurrent pipelines | Stateless Pipeline Engine + per-job-type queues scale horizontally (`09-workflow-engine.md`, `17-queue-system.md`). |
| 300+ concurrent users | WS Gateway horizontal scaling via shared Redis consumer group (`14-websocket-architecture.md`). |
| 100+ worker nodes | Pull-based consumer-group model means adding workers requires zero central reconfiguration (`11-worker-system.md`). |

## Responsibilities
Serve as the load-bearing justification document — every "why" in earlier documents that referenced a performance number points back here for the underlying mechanism.

## Design Decisions
Performance is treated as a set of *budgets allocated per hop* (see `36-data-flow.md`'s sequence), not a single end-to-end number chased after the fact — each component document specifies its own latency contribution, and the sum is checked against the end-to-end target.

## Advantages
Because every target maps to a specific, named mechanism, a regression can be traced to exactly which component's design assumption broke, rather than requiring a broad "everything got slower" investigation.

## Trade-offs
Some mechanisms chosen for performance (Redis semaphores, viewport virtualization) add implementation complexity relative to naive approaches (DB row locks, render-everything) — justified explicitly by the numeric targets in `03-requirements.md`, not performance for its own sake.

## Edge Cases
Performance targets are per-hop budgets under *nominal* load; documented degradation behavior under overload (queue backpressure, dropped low-priority work) is covered in `26-scalability.md`, not here.

## Possible Improvements
Formal load-testing suite (see `29-testing-strategy.md`) that continuously validates each row in the table above, not just at initial build time.

## Best Practices
Any PR that touches a component listed in the mapping table must state whether it affects that component's latency budget.

## References
`03-requirements.md`, `26-scalability.md`, `29-testing-strategy.md`
