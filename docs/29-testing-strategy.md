# 29 — Testing Strategy

## Purpose
Define the testing pyramid for DevFlow, covering the distributed-systems-specific failure modes that simple unit tests can't catch (worker crashes, event reordering, race conditions).

## Responsibilities
- Unit test pure logic (`graph-engine`, `scheduler` packages) exhaustively, cheaply, in isolation.
- Integration test service boundaries (API ↔ Postgres, Engine ↔ Event Bus).
- E2E test full user flows (create pipeline → trigger → observe completion in UI).
- Load test against the targets in `03-requirements.md`.
- Chaos test the failure-recovery paths in `19-failure-recovery.md`.

## Test Layers

**Unit Testing** — `packages/graph-engine` (cycle detection, readiness counting) and `packages/scheduler` are pure functions/classes with no I/O, tested with standard table-driven cases including adversarial inputs (cycles, self-references, diamond dependencies).

**Integration Testing** — spin up real Postgres + Redis (via Testcontainers or Docker Compose test profile) and verify, e.g., that a `job.completed` event correctly updates `JobExecution` status and unblocks the right downstream nodes end to end.

**E2E Testing** — Playwright-driven browser tests exercising the actual Dashboard against a running stack: create a pipeline, trigger it, assert the DAG visually reflects live status changes.

**Load Testing** — synthetic load generators targeting the specific numbers in `03-requirements.md`/`25-performance.md` (500+ concurrent pipelines, 300+ concurrent users, 10,000+ events/min), run in a staging environment sized like production.

**Chaos Testing** — targeted fault injection: kill a worker mid-job and assert claim-timeout reassignment works (`19-failure-recovery.md`); introduce Redis latency and assert Scheduler concurrency accounting stays correct; drop WebSocket connections mid-stream and assert sequence-based resume recovers cleanly.

**Worker Failure Testing** — a chaos-testing subset specifically targeting `11-worker-system.md`/`19-failure-recovery.md` guarantees: exactly the scenarios described in those documents' Edge Cases sections become test cases here, not just prose.

**WebSocket Testing** — reconnect/resume correctness under network interruption, room-scoping correctness (client A never receives client B's execution events).

## Design Decisions
- **Chaos and worker-failure tests are first-class, not an afterthought** — because DevFlow's core value proposition is reliable distributed execution, the failure-recovery paths are exactly the code most likely to be wrong if untested, and least likely to be exercised by normal E2E happy-path tests.

## Advantages
Separating pure-logic unit tests from infrastructure-dependent integration tests keeps the fast feedback loop (unit tests) fast, while still catching real distributed-systems bugs in the slower integration/chaos layers.

## Trade-offs
Chaos and load tests are expensive to run on every PR — they run on a schedule (nightly) and before releases, not on every commit, trading some detection latency for CI speed.

## Edge Cases
Flaky E2E tests (a known risk with real-time UI assertions) are triaged aggressively — a test that intermittently fails for timing reasons, not logic reasons, is fixed or quarantined, never ignored, since ignored flakiness erodes trust in the whole suite.

## Possible Improvements
Property-based testing for `graph-engine` (generate random DAG shapes, assert invariants hold) beyond hand-written cases.

## Best Practices
Every bug fix ships with a regression test reproducing the original failure before the fix, especially for chaos/failure-recovery bugs.

## References
`19-failure-recovery.md`, `25-performance.md`, `26-scalability.md`
