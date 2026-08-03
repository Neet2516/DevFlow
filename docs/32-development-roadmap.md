# 32 — Development Roadmap

## Purpose
Sequence the build across four phases, ordered so each phase produces something demonstrable and de-risks the hardest problems earliest.

## Phase 1 — Foundation (Weeks 1–3)
- Monorepo scaffold, shared types package.
- Domain model + database schema + migrations.
- `graph-engine` package: DAG validation, cycle detection (highest-risk pure logic, built and tested first).
- Basic API: create/read pipeline (no execution yet).

**Deliverable**: a pipeline can be authored (via API, no UI yet) and validated.

## Phase 2 — Execution Core (Weeks 4–7)
- Pipeline Engine, Scheduler, Queue integration (BullMQ + Redis Streams).
- One worker type (`build-worker`) end to end.
- Event Bus wiring: job events → Postgres persistence.
- State machine implementation and enforcement.

**Deliverable**: a pipeline with a single job type can be triggered and runs to completion, observable via API polling.

## Phase 3 — Real-Time & Dashboard (Weeks 8–11)
- WebSocket Gateway.
- Dashboard: DAG canvas (React Flow), live status updates, log viewer.
- Remaining worker types (test, deploy, docker, script).
- Retry mechanism + failure recovery (heartbeats, claim-timeout reassignment).

**Deliverable**: full user-facing flow — create, trigger, watch live, recover from failure — for all core job types.

## Phase 4 — Production Hardening (Weeks 12–14)
- Observability: metrics (Prometheus/Grafana), structured logging with correlation IDs.
- Security: auth, authorization, secrets handling, log redaction.
- Load testing against `03-requirements.md` targets; chaos testing worker-failure paths.
- Execution replay.

**Deliverable**: a system that meets its stated performance targets under load and degrades predictably under failure.

## Dependencies
Phase 2 depends on Phase 1's `graph-engine` and schema being stable. Phase 3's Dashboard depends on Phase 2's Event Bus wiring existing. Phase 4's load/chaos testing depends on Phase 3's failure-recovery mechanisms being implemented, not just designed.

## Design Decisions
DAG validation logic is built and hardened *first*, before any execution machinery, because it's the piece every other phase depends on and the one most amenable to exhaustive testing in isolation — de-risking it early avoids discovering fundamental graph-logic bugs deep into Phase 3.

## Advantages
Each phase ends with something runnable/demonstrable, not just a pile of unintegrated code — useful for both morale and for catching integration issues early.

## Trade-offs
Building only one worker type in Phase 2 means Phase 2's "done" pipeline isn't yet representative of the full system — accepted because proving the execution core end to end with one job type is lower risk than building all job types before proving the core works at all.

## Edge Cases
If Phase 2 reveals the Event Bus design needs rework, that must happen before Phase 3 dashboard work begins — the roadmap assumes willingness to pause forward progress to fix foundational issues rather than build UI on top of a shaky core.

## Possible Improvements
Parallelize Phase 3's worker-type expansion with dashboard work across two workstreams once the Event Bus contract is stable.

## Best Practices
Treat each phase's "deliverable" as a real Definition of Done, not aspirational — don't start the next phase's work until the current phase's deliverable actually works end to end.

## References
`33-milestones.md`, `29-testing-strategy.md`
