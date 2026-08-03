# 21 — Observability

## Purpose
Define how DevFlow makes its own distributed, asynchronous behavior debuggable — the tracing and correlation strategy that ties together metrics (`28-monitoring.md`), logs (`20-log-streaming.md`), and the event-driven architecture.

## Responsibilities
- Correlate every log line, metric, and event to a specific execution and job.
- Make it possible to reconstruct the full timeline of any execution after the fact.
- Surface system-level health (queue backlogs, event lag) proactively, not just after user-facing symptoms appear.

## Design Decisions
- **Every event, log line, and API request carries `executionId` and, where applicable, `jobId`** as correlation identifiers — this single convention is what makes it possible to answer "what happened to execution ex_789" by querying one dimension across every subsystem, rather than manually cross-referencing timestamps.
- **The Event Bus itself doubles as the trace source** — because every state transition is already a durable, sequenced event (`13-event-bus.md`), we get most of the value of distributed tracing without introducing a separate tracing pipeline for v1. A dedicated OpenTelemetry layer is deferred (see Possible Improvements) rather than built upfront, since the event log already covers the dominant debugging need: "what happened, in what order."

## Internal Components
Three pillars, explicitly distinguished:
- **Metrics** (`28-monitoring.md`) — aggregate, numeric, cheap to query, answer "is the system healthy right now."
- **Logs** (`20-log-streaming.md`) — job-level stdout/stderr, answer "what did this specific job print."
- **Events** (`13-event-bus.md`) — structured state transitions, answer "what happened, in what order, to this execution."

## Data Flow
An on-call engineer investigating a stuck execution queries: (1) Grafana for whether queue depth/worker health looks abnormal system-wide, (2) the Event Bus / Postgres event history filtered by `executionId` to see the exact transition sequence, (3) the persisted logs for the specific failing `jobId`. All three queries use the same correlation ID.

## Advantages
Reusing the event log as the trace source avoids running two parallel "what happened" systems (events and traces) that could disagree with each other.

## Trade-offs
Without dedicated distributed tracing spans, cross-service *latency breakdown* (exactly how many ms were spent in Scheduler vs. Queue vs. Worker startup) is harder to get than with OpenTelemetry — acceptable for v1 since sequence-based event ordering already answers most debugging questions; span-level timing is deferred.

## Edge Cases
A correlation ID must be generated at the earliest possible point (API request receipt) and propagated through every downstream hop — any code path that generates work without propagating the incoming `executionId`/`jobId` is a bug, and should be caught by lint/review convention.

## Possible Improvements
Add OpenTelemetry spans across the sequence in `36-data-flow.md` once latency-breakdown debugging (not just ordering) becomes a recurring need.

## Best Practices
Structured logging only (JSON), never free-text `console.log`, so correlation IDs remain machine-queryable across every service.

## References
`13-event-bus.md`, `20-log-streaming.md`, `28-monitoring.md`
