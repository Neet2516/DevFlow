# 18 — Retry Mechanism

## Purpose
Define how failed JobExecutions are automatically or manually retried, and how retry policy is configured per job.

## Responsibilities
- Apply exponential backoff for automatic retries.
- Track attempt count and enforce a max-attempts ceiling per job.
- Support manual retry (single node) and full pipeline restart, distinctly from automatic retry.

## Retry Policy Shape
```json
{
  "maxAttempts": 3,
  "backoff": { "type": "exponential", "baseMs": 1000, "maxMs": 30000 },
  "retryableExitCodes": "any"
}
```

## Design Decisions
- **Retry policy is per-job, not global** — a flaky integration test suite might warrant `maxAttempts: 3`, while a deploy job might warrant `maxAttempts: 1` (you don't want to accidentally deploy twice). Defaulting policy at the pipeline level with per-job override covers both cases without forcing one-size-fits-all.
- **Exponential backoff with a cap**, not fixed-interval retry — protects downstream systems (e.g., a flaky external API) from being hammered by synchronized retry storms across many concurrently failing jobs.
- **Automatic retry reuses the same JobExecution row with an incremented `attempt`**, not a new row — this keeps history of "this job" coherent in the UI as one timeline rather than N disconnected rows.

## Data Flow
1. JobExecution transitions to `failed` (see `16-state-machine.md`).
2. Retry evaluator checks `attempt < maxAttempts`.
3. If eligible: schedule a delayed re-enqueue (`attempt + 1`) after the computed backoff, transition to `retrying`.
4. If not eligible: transition to `failed_terminal`, propagate failure to the Pipeline Engine for downstream-node skip logic.

## Advantages
Centralizing retry logic in one evaluator (rather than scattering ad hoc retry loops across worker code) makes retry behavior auditable and consistent across all job types.

## Trade-offs
Exponential backoff increases worst-case time-to-terminal-failure versus immediate retry — an acceptable trade given it protects system stability under correlated failures (e.g., a downstream service outage affecting many jobs at once).

## Edge Cases
- **Non-idempotent jobs** (e.g., a deploy that partially applied before failing) must not be blindly auto-retried — job authors mark such jobs `retryableExitCodes: []` to disable automatic retry, requiring manual intervention with explicit awareness of partial state.
- **Retry after manual cancel** must not occur — cancellation is a terminal, non-retryable transition regardless of remaining attempts.

## Possible Improvements
Per-exit-code retry rules (retry on network timeout, don't retry on assertion failure) — currently coarse-grained via `retryableExitCodes`.

## Best Practices
Every retryable job should be written idempotently wherever possible; document non-idempotent jobs explicitly in the pipeline definition.

## References
`16-state-machine.md`, `19-failure-recovery.md`, `17-queue-system.md`
