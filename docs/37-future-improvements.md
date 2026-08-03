# 37 — Future Improvements (Advanced Features)

## Purpose
Catalog the features explicitly deferred from v1, with enough architectural context that implementing them later doesn't require rethinking the core system.

## Candidate Features
- **AI Failure Analysis** — a new Event Bus consumer group that ingests `job.failed` events + logs and surfaces likely root cause; fits the existing fan-out model from `13-event-bus.md` with zero changes to producers.
- **AI Deployment Suggestions** — recommend retry policy or resource allocation based on historical Execution data already persisted in Postgres.
- **Auto Rollback** — a new job type/policy that, on deploy failure, automatically triggers a previously-successful deploy job's inverse — requires deploy jobs to define a rollback action, a schema extension to `Job` (`06-domain-model.md`).
- **GitHub Integration** — webhook-triggered pipeline execution on PR/push events; a thin adapter in front of the existing `POST /executions` API.
- **Kubernetes Integration** — replace/augment Docker Compose worker pools with Kubernetes-native autoscaling workers, directly extending `27-devops.md`'s deployment model.
- **Slack / Discord / Email Alerts** — additional Notification Service consumer groups off the Event Bus, per the architecture already sketched in `13-event-bus.md`.
- **Multi-Tenant Organizations + RBAC** — the largest deferred feature; requires a `tenant_id` migration across the schema (`07-database-design.md`) and replacing the flat role model (`24-authorization.md`) with per-organization, per-resource permissions.
- **Audit Logs** — a durable, queryable record of every mutating action; naturally implemented as another Event Bus consumer, since mutating actions already flow through consistent API paths.
- **Pipeline Templates** — reusable PipelineVersion definitions parameterized at trigger time.
- **Live Collaboration** — multiple users editing a pipeline definition simultaneously; would require an operational-transform or CRDT layer on top of the pipeline editor, a genuinely new subsystem.
- **Mobile Dashboard** — a read-focused mobile client consuming the same REST/WebSocket APIs.

## Design Decisions
Every deferred feature above was evaluated against one question: does it require changing the core event-driven architecture, or does it slot in as a new consumer/adapter? Everything in this list except multi-tenancy and live collaboration is an additive consumer or adapter — validating that the Phase 1–4 architecture was designed with genuine extensibility, not just sufficiency for v1.

## Advantages
Because most future features are additive Event Bus consumers, they can be built and shipped independently, by different people, without touching the execution core — a healthy sign for long-term maintainability.

## Trade-offs
Multi-tenancy is honestly flagged as the one deferred feature requiring real schema/authorization surgery — not sugar-coated as "just another consumer," because it isn't.

## Edge Cases
Auto Rollback in particular introduces a new failure mode (a rollback that itself fails) that would need its own recovery policy, not automatically inherited from `19-failure-recovery.md`'s existing retry model.

## Possible Improvements
This document itself should be revisited each time a v1 milestone (`33-milestones.md`) completes, to re-prioritize based on real usage patterns rather than upfront guesses.

## Best Practices
Don't build speculative infrastructure for these features now — the architecture's job is to not preclude them, not to pre-implement them.

## References
`13-event-bus.md`, `24-authorization.md`, `07-database-design.md`
