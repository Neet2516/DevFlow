# 31 — Coding Guidelines

## Purpose
Establish consistent engineering conventions across all services, packages, and apps so the codebase reads as one system, not a collection of individually-styled modules.

## Responsibilities
Define TypeScript, testing, commit, and review conventions binding on every contribution.

## Guidelines

**TypeScript**
- `strict: true` everywhere; no `any` without an inline justification comment.
- Domain types (Pipeline, Execution, JobExecution, Event shapes) live in `packages/shared` and are imported, never redefined locally.
- Prefer discriminated unions for event/status types over string literals scattered ad hoc — this is what makes the state machine (`16-state-machine.md`) type-checkable.

**Error Handling**
- Services never swallow errors silently; every catch block either handles the error meaningfully or re-throws with added context.
- Distinguish expected failures (job failed — a normal outcome, modeled in the state machine) from unexpected errors (a bug, an unhandled exception) — only the latter pages on-call.

**Async/Event Code**
- Every Event Bus consumer function is idempotent by construction — reviewers explicitly check "what happens if this runs twice" on any PR touching a consumer.
- No unbounded retry loops without backoff and a max-attempts ceiling, per `18-retry-mechanism.md`'s pattern.

**Commits & Reviews**
- Conventional commits (`feat:`, `fix:`, `refactor:`) for changelog generation.
- Every PR touching a component listed in `25-performance.md`'s mapping table states its performance impact.
- No PR merges without at least one passing review from someone outside the immediate sub-team, to catch cross-boundary assumptions.

## Design Decisions
Idempotency-by-construction for event consumers is called out as a *review requirement*, not just a design suggestion — because it's the single most common source of subtle distributed-systems bugs (`13-event-bus.md`'s at-least-once delivery guarantee makes this non-optional).

## Advantages
Codifying "what happens if this runs twice" as an explicit review question catches an entire class of bugs before merge, rather than in production.

## Trade-offs
Strict typing and mandatory idempotency review add friction to fast prototyping — accepted because DevFlow's core reliability promise depends on exactly these properties.

## Edge Cases
Genuinely one-shot, non-idempotent operations (rare) must be explicitly documented as such at the call site with a comment explaining the guarding mechanism (distributed lock, unique constraint) that prevents double execution.

## Possible Improvements
Automated lint rule that flags Event Bus consumer functions lacking an idempotency-guard pattern.

## Best Practices
When in doubt, favor the pattern already established elsewhere in the codebase over introducing a new one — consistency compounds.

## References
`13-event-bus.md`, `18-retry-mechanism.md`, `30-folder-structure.md`
