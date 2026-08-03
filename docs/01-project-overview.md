# 01 — Project Overview

## Purpose
DevFlow is a production-grade, distributed workflow orchestration platform for CI/CD pipelines. It gives engineering teams a way to define, execute, monitor, and debug complex, dependency-aware pipelines across a pool of distributed worker nodes, with real-time visualization of execution state.

It is not a logs-first CI tool like a typical Jenkins job page. It is a graph-first, observability-first system in the spirit of Temporal, Argo Workflows, and Dagster, wrapped in a GitHub-Actions-style authoring experience.

## Responsibilities
- Provide a pipeline authoring surface (DAG builder) where users define jobs, dependencies, conditions, and retry policies.
- Resolve dependencies into an executable DAG and schedule work across distributed workers.
- Execute jobs reliably, with retries, timeouts, and failure isolation.
- Stream execution state (job status, logs, metrics) to clients in real time.
- Persist full execution history to support replay, audits, and regression analysis.
- Expose observability data (queue depth, worker health, throughput, latency) for operational visibility.

## Design Decisions
- **Separate authoring from execution.** The Pipeline Engine (control plane) never runs user code directly; it only resolves graphs and dispatches units of work to Worker Nodes (data plane). This isolates blast radius: a worker crash cannot corrupt scheduling state.
- **Event-driven core.** Every state transition (job started, job completed, retry triggered) is emitted as an event on an Event Bus rather than written directly by callers into shared state. This decouples producers (workers) from consumers (dashboard, database writers, notification services) and lets us add new consumers without touching the execution path.
- **DAG as the unit of truth**, not a linear list of steps — because real pipelines fan out (parallel test suites) and fan in (deploy waits on build + test + scan).

## Internal Components
See `02-system-architecture.md` for the full component map: Pipeline Engine, Dependency Graph Builder, Scheduler, Queue, Worker Nodes, Event Bus, Database, WebSocket Gateway, Frontend Dashboard.

## Data Flow
Developer defines pipeline → Pipeline Engine builds DAG → Scheduler enqueues ready nodes → Worker Nodes execute → results flow back through the Event Bus → persisted to the Database and streamed live to the Dashboard via WebSockets.

## Advantages
- Real-time visibility replaces "refresh and hope" debugging.
- Horizontal worker scaling handles bursty CI load without redesigning the control plane.
- Execution replay turns incidents into reproducible, inspectable timelines.

## Trade-offs
- Event-driven architecture is harder to reason about linearly than a simple request/response CI runner; requires strong tracing/correlation IDs (see `21-observability.md`).
- Real-time DAG rendering at scale (10,000+ nodes) demands frontend virtualization work most CI dashboards skip.

## Edge Cases
- Pipelines with cyclic dependencies must be rejected at DAG-build time, not at runtime.
- Partial worker network partitions must not be interpreted as job failure (see `19-failure-recovery.md`).

## Possible Improvements
AI-assisted failure triage, auto-rollback, and Kubernetes-native worker pools — see `37-future-improvements.md`.

## Best Practices
Treat the DAG, not the pipeline YAML, as the runtime source of truth. Version every schema (pipeline definition, event payloads) from day one.

## References
`02-system-architecture.md`, `09-workflow-engine.md`, `10-dag-execution.md`
