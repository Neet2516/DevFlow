# 08 — API Design

## Purpose
Define the REST API surface for pipeline and execution management, and the conventions every endpoint follows.

## Conventions
- Base path: `/api/v1`
- Auth: Bearer JWT in `Authorization` header (see `23-authentication.md`)
- Content type: `application/json`
- Pagination: cursor-based (`?cursor=<id>&limit=<n>`), never offset-based, to stay stable under high write volume.
- Errors: RFC 7807-style problem responses.

## Key Endpoints

### Create Pipeline
`POST /api/v1/pipelines`

**Request**
```json
{ "name": "backend-deploy", "dag": { "jobs": [ /* ... */ ] } }
```

**Response — 201**
```json
{ "id": "pl_123", "name": "backend-deploy", "versionId": "plv_456" }
```

**Validation**: DAG must pass cycle detection and reference-integrity checks (all `dependsOn` ids must exist) before persistence — validation failures return `422` with a per-node error list, not a generic 400.

**Errors**: `400` malformed JSON · `401` unauthenticated · `422` invalid DAG · `429` rate limited

### Trigger Execution
`POST /api/v1/pipelines/:id/executions`

**Response — 202** (accepted, execution is async)
```json
{ "executionId": "ex_789", "status": "pending" }
```
`202` rather than `201` — the execution is accepted, not yet complete or even guaranteed to have started; clients must poll or subscribe via WebSocket for terminal status.

### Get Execution
`GET /api/v1/executions/:id`

**Response — 200**
```json
{
  "id": "ex_789",
  "status": "running",
  "jobs": [
    { "id": "job_1", "status": "succeeded" },
    { "id": "job_2", "status": "running" }
  ]
}
```

### List Executions (paginated)
`GET /api/v1/pipelines/:id/executions?cursor=ex_700&limit=20`

### Retry / Cancel
`POST /api/v1/executions/:id/retry` — body: `{ "mode": "failed-node" | "entire-pipeline" }`
`POST /api/v1/executions/:id/cancel`

## Authentication
Bearer JWT, short-lived access token + refresh token pair. See `23-authentication.md` for the full flow.

## Rate Limiting
Token-bucket per API key, `429` with `Retry-After` header. Limits are generous for read endpoints, stricter for `POST /executions` to prevent queue-flooding.

## Design Decisions
- **REST for CRUD/control operations, WebSockets for live state** — REST because pipeline/execution management is naturally request/response and benefits from HTTP semantics (idempotency, caching, standard tooling); WebSockets because live status is a stream, not a resource.
- **Cursor pagination over offset** — offset pagination breaks under concurrent writes (an execution list shifts under the client mid-scroll); cursors are stable.
- **202 Accepted for execution triggers** — makes the async nature of execution explicit in the HTTP contract instead of implying synchronous completion.

## Advantages
Clear separation of concerns between control-plane REST and real-time WebSocket channels means each can be scaled, cached, and rate-limited independently.

## Trade-offs
Clients must implement two connection types (HTTP + WS) instead of one — justified by the fundamentally different data-access patterns.

## Edge Cases
Duplicate execution-trigger requests (e.g., a retried client call) are made idempotent via an optional `Idempotency-Key` header, deduped for 24 hours.

## Possible Improvements
GraphQL gateway for clients that want to compose pipeline + execution + worker data in a single round trip (evaluate once dashboard query patterns stabilize).

## Best Practices
Every breaking API change ships behind `/api/v2`; `v1` is supported for at least one deprecation cycle.

## References
`23-authentication.md`, `24-authorization.md`, `14-websocket-architecture.md`
