# 33 — Milestones

## Purpose
Translate the roadmap's four phases into concrete, checkable milestones with explicit acceptance criteria.

## M1 — Schema & Validation Complete
**Acceptance criteria**
- [ ] Domain model implemented as Prisma schema, migrations run cleanly.
- [ ] `graph-engine` rejects cyclic and dangling-reference DAGs with unit tests covering diamond dependencies, self-references, and orphaned nodes.
- [ ] `POST /pipelines` persists a valid pipeline and returns `422` with per-node errors for invalid ones.

## M2 — Single-Job-Type Execution Works End to End
**Acceptance criteria**
- [ ] Triggering an execution with one `build` job results in a `succeeded` Execution row, observable via `GET /executions/:id`.
- [ ] Every state transition has a corresponding Event Bus entry, correctly persisted to Postgres.
- [ ] Killing the worker mid-job results in automatic reassignment and eventual completion (manual test acceptable at this stage; formalized in M4's chaos suite).

## M3 — Full Dashboard Experience
**Acceptance criteria**
- [ ] DAG renders and updates live for all five job types (build/test/security-scan/docker/deploy) without manual refresh.
- [ ] Log viewer streams output with no visible lag under normal load.
- [ ] Manual retry, skip-step, and restart-from-node all work from the UI and produce correct state-machine transitions.
- [ ] Graph maintains 60 FPS on a synthetic 10,000-node test pipeline.

## M4 — Production Readiness
**Acceptance criteria**
- [ ] Load test sustains 500+ concurrent pipelines and 300+ concurrent WebSocket clients within the latency targets from `03-requirements.md`.
- [ ] Chaos suite (worker kill, Redis latency injection, WebSocket disconnect) passes with documented recovery behavior matching `19-failure-recovery.md`.
- [ ] Grafana dashboards show all five metric categories from `28-monitoring.md` populated with real data.
- [ ] Secrets never appear in plaintext logs (verified via a redaction test suite).

## Design Decisions
Each milestone's acceptance criteria are written as testable assertions, not vague descriptions ("dashboard works") — so "done" is objectively checkable rather than subjectively judged.

## Advantages
Milestones map directly onto roadmap phases, so schedule slippage in one is immediately visible as slippage in the corresponding phase, rather than being discovered later.

## Trade-offs
Rigid milestone gating (not starting M3 UI work until M2's execution core is solid) trades some parallelization opportunity for confidence that later work isn't built on a shaky foundation.

## Edge Cases
If M4's chaos suite uncovers a fundamental issue in the failure-recovery design from `19-failure-recovery.md`, that's treated as a blocking finding requiring a design revisit, not a bug to patch around under schedule pressure.

## Possible Improvements
Add an M5 covering multi-tenancy/RBAC once those features move from `37-future-improvements.md` into active scope.

## Best Practices
Review milestone acceptance criteria against `03-requirements.md` before declaring a milestone complete — criteria drift from requirements over time if not actively cross-checked.

## References
`32-development-roadmap.md`, `03-requirements.md`, `29-testing-strategy.md`
