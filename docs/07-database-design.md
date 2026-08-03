# 07 — Database Design

## Purpose
Translate the domain model (`06-domain-model.md`) into a normalized PostgreSQL schema with the indexes needed to hit the performance targets in `03-requirements.md`.

## Core Tables (simplified Prisma-style)

```prisma
model Pipeline {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  versions  PipelineVersion[]
}

model PipelineVersion {
  id         String   @id @default(cuid())
  pipelineId String
  pipeline   Pipeline @relation(fields: [pipelineId], references: [id])
  dagJson    Json      // validated DAG definition
  createdAt  DateTime @default(now())
  jobs       Job[]
  executions Execution[]

  @@index([pipelineId, createdAt])
}

model Job {
  id                String   @id @default(cuid())
  pipelineVersionId String
  name              String
  type              String   // build | test | deploy | docker | script
  dependsOn         String[] // job ids this job depends on
  retryPolicy       Json

  @@index([pipelineVersionId])
}

model Execution {
  id                String   @id @default(cuid())
  pipelineVersionId String
  status            String   // pending | running | succeeded | failed | cancelled
  startedAt         DateTime?
  finishedAt        DateTime?
  jobExecutions     JobExecution[]

  @@index([pipelineVersionId, status])
  @@index([status, startedAt])
}

model JobExecution {
  id          String   @id @default(cuid())
  executionId String
  jobId       String
  workerId    String?
  status      String
  attempt     Int      @default(1)
  startedAt   DateTime?
  finishedAt  DateTime?

  @@index([executionId, status])
  @@index([workerId, status])
}

model Worker {
  id           String   @id @default(cuid())
  status       String   // idle | busy | offline
  lastHeartbeat DateTime
  capacity     Int

  @@index([status, lastHeartbeat])
}
```

## Design Decisions
- **`dagJson` stored as JSONB on PipelineVersion**, not fully normalized into edge rows, because the DAG is read as a whole graph far more often than queried edge-by-edge — normalizing it would add join overhead for zero real benefit.
- **Composite indexes on `(status, startedAt)` and `(executionId, status)`** directly serve the two hottest queries: "show me all currently-running executions" and "show me job status for this execution" — both power the real-time dashboard.
- **Soft status enums as strings, not Postgres enums**, to avoid migration friction when adding new statuses (e.g., a future `skipped` status) — a trade-off of type safety for schema agility, enforced instead at the application layer via TypeScript literal types shared through `packages/shared`.

## Data Flow
Event Bus consumers write to `JobExecution` and `Execution` rows on every relevant event, using the event's `sequence` number to guard against out-of-order writes (an `UPDATE ... WHERE sequence < $new_sequence` pattern).

## Advantages
Indexes are purpose-built for the two access patterns that actually matter operationally (live dashboard, execution detail), rather than indexing defensively on every column.

## Trade-offs
JSONB for `dagJson` sacrifices the ability to run efficient SQL queries *across* DAG structure (e.g., "find all pipelines that use job type X") — acceptable because that query pattern doesn't exist in v1; if it emerges, a derived `job_type_index` table can be added without touching the core schema.

## Edge Cases
Concurrent JobExecution updates from retried workers must be idempotent — writes are keyed on `(jobExecutionId, attempt)`, and out-of-order event delivery is guarded by sequence-number checks.

## Possible Improvements
Partition `Execution`/`JobExecution` tables by time once execution history grows large enough to affect index size and vacuum performance.

## Best Practices
Every migration is additive and backward-compatible within a release; destructive migrations (column drops) only ship after the application code no longer references the column.

## References
`06-domain-model.md`, `16-state-machine.md`, `26-scalability.md`
