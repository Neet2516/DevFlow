# DevFlow — Session Context & Handover State

> **Purpose**: High-density context document for AI session resumption. Read this file to catch up on current system state, architecture, completed milestones, and exact remaining steps without re-reading raw transcripts or full docs.

---

## 1. System Overview & Monorepo Layout

- **Repository**: `https://github.com/Neet2516/DevFlow.git`
- **Architecture**: Microservices monorepo with central Postgres (`:5433` local), Redis (`:6379`), API Gateway (`:3000`), Pipeline Service (`:3001`), Execution Service (`:3002`), WebSocket Gateway (`:3003`), and Dashboard (`:5173`).
- **Core Loop**: `Pipeline Definition` -> `Cycle Validation (graph-engine)` -> `Trigger Execution` -> `Root Job Enqueued to BullMQ` -> `Worker Runtime Claims & Spawns Subprocess` -> `stdout Line-Buffered to Redis Streams (job-events)` -> `State Machine Advances & Downstream Triggered` -> `WebSocket Gateway Streams to React Dashboard (React Flow + Motion)`.

### Workspace Package Map
```
DevFlow/
├── apps/
│   ├── api/             # Gateway: proxies /api/v1/* to pipeline (3001), execution (3002), ws (3003)
│   ├── dashboard/       # React + Vite + Framer Motion (@xyflow/react, Zustand, TanStack Query)
│   └── worker/          # Core WorkerRuntime class (BullMQ worker + heartbeat + subprocess runner + log flusher)
├── packages/
│   ├── shared/          # Shared domain types, event bus schemas, queue constants, state machine validators
│   ├── db/              # Prisma schema + client (@devflow/db)
│   ├── graph-engine/    # DAG builder, cycle detection algorithm, topological sorter
│   ├── scheduler/       # Enqueue engine, concurrency semaphore via Redis
│   ├── logger/          # Structured JSON logger with correlation ID (executionId, jobId)
│   ├── auth/            # JWT authentication middleware and token signing
│   └── metrics/         # Prometheus metrics registry (throughput, queue depth, latency histograms)
├── services/
│   ├── pipeline/        # CRUD for pipelines & versions (3001)
│   ├── execution/       # DAG execution engine, state machine, liveness sweeper, manual actions (3002)
│   └── websocket/       # Dedicated WS Gateway (3003) with room-based execution subscriptions
├── workers/
│   ├── build-worker/    # Worker adapter for QUEUES.BUILD ('build-queue')
│   ├── test-worker/     # Worker adapter for QUEUES.TEST ('test-queue')
│   ├── docker-worker/   # Worker adapter for QUEUES.DOCKER ('docker-queue')
│   ├── deploy-worker/   # Worker adapter for QUEUES.DEPLOY ('deploy-queue')
│   └── script-worker/   # Worker adapter for QUEUES.SCRIPT ('script-queue')
├── tests/
│   └── integration/     # Jest integration tests for DAG validation & state transitions
├── infra/
│   ├── prometheus.yml   # Scrape config for execution, pipeline, websocket metrics
│   └── grafana/         # Provisioning datasources
└── docker-compose.prod.yml # Complete production stack setup
```

---

## 2. Milestone Progress & Accomplishments

### ✅ Milestone 1: Monorepo & Validation Core
- Schema defined in `@devflow/db`.
- Cycle detection (Tarjan's/DFS) and diamond DAG validation in `@devflow/graph-engine`.
- Pipeline creation & persistence API in `services/pipeline`.

### ✅ Milestone 2: Execution Engine Core
- BullMQ queue dispatcher in `@devflow/scheduler`.
- Subprocess execution & event stream publisher in `@devflow/worker`.
- Reactive state machine & downstream topological walker in `services/execution`.

### ✅ Milestone 3: Failure Recovery & Heartbeats
- Worker liveness sweep (15s inactivity threshold) via `services/execution/src/engine/livenessMonitor.ts`.
- Infra-level retries (3 attempts max) prior to breaking job retry budget.
- Automatic claim-timeout reassignment verified via E2E recovery test.

### ✅ Milestone 4: WebSocket Gateway & Motion Dashboard
- Dedicated WebSocket service (`services/websocket`) consuming Redis Stream `job-events`.
- Room-based filtering (`executionId` rooms) minimizing broadcast traffic.
- React + Vite dashboard (`apps/dashboard`) using `@xyflow/react` and `motion/react` (Framer Motion).
- Live log streaming panel, status badge transitions, pulsing running nodes, and manual actions (`Retry`, `Skip`, `Restart Execution`).

### ✅ Production Hardening & Advanced Enterprise Features
- Added 4 specialized workers (`test-worker`, `docker-worker`, `deploy-worker`, `script-worker`).
- Built `@devflow/logger` (structured JSON logging with correlation IDs).
- Built `@devflow/auth` (JWT verification & token signing).
- Built `@devflow/metrics` (Prometheus counters, gauges, histograms).
- Built `@devflow/templates` (out-of-the-box pre-configured enterprise DAG templates for Node.js, Python, Go, and Java).
- Built `services/ai-analyzer` (Event Bus consumer for automated AI Root Cause Failure Analysis & recommendations).
- Built `services/notification` (Event Bus consumer for Slack/Discord webhook alerts).
- Built `services/github-adapter` (GitHub webhook integration, HMAC verification, git variable extraction).
- Built `services/audit` (Event Bus consumer for compliance audit trail, `GET /api/v1/audit`).
- Implemented Pipeline Variable Injection Engine in `services/execution` (`startExecution.ts`).
- Built Automated Secret Redaction Engine in `apps/worker` (`WorkerRuntime` log flusher).
- Built Execution Logs Export Engine (`GET /api/v1/executions/:id/logs/export?format=txt|json` returns formatted log attachments).
- Added Export Logs action button with Download icon in Dashboard `LogPanel` header.
- Built Pipeline Dry-Run Sandbox API (`POST /api/v1/pipelines/validate` validates DAG topology, cycle hazards, and computes estimated step latencies).
- Built Execution Cancellation Engine in `services/execution` (`POST /api/v1/executions/:id/cancel` updates status to `cancelled`, aborts pending/running jobs, and emits `execution.completed` event).
- Added Cancel Run action control with Ban icon in Dashboard `ActionPanel` UI.
- Built `diffDag` Engine in `@devflow/graph-engine` (computes added, removed, and modified jobs across pipeline versions).
- Built Performance Analytics API (`GET /api/v1/analytics/performance`) in `services/execution` (calculates execution throughput, step latencies, success rates).
- Integrated Tailwind CSS v3 & Autoprefixer engine in `@devflow/dashboard` with Vite PostCSS pipeline.
- Refactored UI components (`DagNode`, `LogPanel`, `ActionPanel`, `Header`) with Tailwind utility classes.
- Added `docker-compose.prod.yml` and Prometheus / Grafana provisioning.
- Created comprehensive root `README.md` with system architecture diagrams, quickstart guides, microservices catalog, API reference table, and test instructions.
- Verified 35/35 Jest integration & unit tests (`pipeline.test.mjs`, `ai_analyzer.test.mjs`, `github_webhook.test.mjs`, `templates_redaction.test.mjs`, `analytics_diff.test.mjs`, `cancellation.test.mjs`, `export_sandbox.test.mjs`).
- Verified Multi-Job E2E suite (`tests/e2e/multi_job_e2e.js`) and Chaos Recovery suite (`tests/e2e/chaos_recovery_test.js`) with 100% clean passes.

---

## 3. Environment & Technical Gotchas

1. **Database Port**: Postgres is hosted on port `5433` (due to local port 5432 conflict).
2. **ESM Module Resolution**: Node.js ESM mode requires relative imports in TypeScript to use `.js` extension (e.g. `import { startExecution } from './engine/startExecution.js'`).
3. **`__dirname` in ESM**: Must be constructed using `path.dirname(fileURLToPath(import.meta.url))`.
4. **Git Output Warning**: Windows PowerShell treats stderr output from `git push` as exit code 1. Check stdout/remote ref update to confirm push success (`main -> main`).
5. **Background Process Management**: All dev services can be built via `npm run build` and started as needed.

---

## 4. Next Session Quick-Start Checklist

1. **To run the full stack locally**:
   ```powershell
   # Ensure Postgres (5433) and Redis (6379) Docker containers are running
   docker compose up -d

   # Build monorepo packages
   npm run build

   # Services ports:
   # API Gateway: 3000
   # Pipeline: 3001
   # Execution: 3002
   # WebSocket: 3003
   # Dashboard: 5173
   ```
2. **To run integration tests**:
   ```powershell
   npm run test -w @devflow/tests
   ```
3. **To launch production compose stack**:
   ```powershell
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

*Handover document auto-generated for optimal token consumption during future session resumption.*
