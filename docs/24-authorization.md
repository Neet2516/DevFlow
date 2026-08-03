# 24 — Authorization

## Purpose
Define what an authenticated user is permitted to do — scoped for v1's single-tenant model, with a clear extension path to the RBAC described in `37-future-improvements.md`.

## Responsibilities
- Gate mutating actions (create/edit/delete pipeline, trigger/cancel/retry execution) behind permission checks.
- Keep the permission model simple in v1 while not foreclosing multi-tenant RBAC later.

## Design Decisions
- **v1 uses a flat role model** (`admin`, `member`, `viewer`) rather than fine-grained per-resource ACLs — appropriate for a single-tenant deployment where the primary distinction that matters is "can mutate" vs. "can only observe." Building fine-grained ACLs now, before multi-tenancy exists, would be speculative complexity.
- **Authorization checks live in the API service, not scattered across `services/`** — every mutating endpoint calls a shared `can(user, action, resource)` check from `packages/shared`, so the permission logic has one implementation and one place to audit.

## Internal Components
```
viewer  -> read pipelines, executions, logs, metrics
member  -> viewer + create/edit pipelines, trigger/cancel/retry executions
admin   -> member + manage workers, view all users' pipelines
```

## Data Flow
Every mutating REST call passes through an authorization middleware that resolves the caller's role from their JWT claims and checks it against the required permission for that route before the handler executes — unauthorized calls return `403`, never silently succeed with reduced scope.

## Advantages
A flat role model is trivial to reason about and audit — there's no ambiguity about who can do what.

## Trade-offs
No per-pipeline ownership/sharing in v1 — any `member` can edit any pipeline. Acceptable for single-tenant use; explicitly called out as a gap closed by future multi-tenant RBAC, not an oversight.

## Edge Cases
Read-only WebSocket subscriptions (viewing execution status) require only `viewer`-level access, but manual recovery actions triggered from the dashboard (`19-failure-recovery.md`) go through the same REST authorization path as any other mutating call — the WebSocket connection itself never bypasses authorization for actions.

## Possible Improvements
Full RBAC with per-organization, per-pipeline permission scoping (see `37-future-improvements.md`).

## Best Practices
Never infer authorization from the frontend hiding a button — every check is enforced server-side regardless of what the UI displays.

## References
`23-authentication.md`, `22-security.md`, `37-future-improvements.md`
