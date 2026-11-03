# DevFlow — Distributed CI/CD Workflow Engine 🚀

[![Build & Test Suite](https://github.com/Neet2516/DevFlow/actions/workflows/build-test.yml/badge.svg)](https://github.com/Neet2516/DevFlow/actions/workflows/build-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs--devflow.vercel.app-black.svg)](https://docs-devflow.vercel.app/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](package.json)

DevFlow is a modern, high-throughput, fault-tolerant distributed DAG workflow and CI/CD engine built with Node.js, TypeScript, Express, BullMQ, Redis Streams, PostgreSQL, and React.

📖 **[View Live Documentation Site](https://docs-devflow.vercel.app/)**

---

## 🏛️ System Architecture

```
                                ┌──────────────────────────┐
                                │  React + Vite Dashboard  │
                                │   (Tailwind + Motion)    │
                                └────────────┬─────────────┘
                                             │ HTTP (3000) / WebSocket (3003)
                                             ▼
                                ┌──────────────────────────┐
                                │    API Gateway (3000)    │
                                └──────┬─────┬──────┬──────┘
                                       │     │      │
            ┌──────────────────────────┘     │      └──────────────────────────┐
            ▼                                ▼                                 ▼
┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
│  Pipeline Service    │        │  Execution Service   │        │  AI Failure Analyzer │
│      (Port 3001)     │        │      (Port 3002)     │        │      (Port 3004)     │
└──────────┬───────────┘        └──────────┬───────────┘        └──────────┬───────────┘
           │                               │                               │
┌──────────┴───────────┐        ┌──────────┴───────────┐        ┌──────────┴───────────┐
│ Notification Service │        │ WebSocket Gateway    │        │ Compliance Audit Svc │
│      (Port 3005)     │        │      (Port 3003)     │        │      (Port 3007)     │
└──────────┬───────────┘        └──────────┬───────────┘        └──────────┬───────────┘
           │                               │                               │
           │                    ┌──────────▼───────────┐                   │
           └───────────────────►│ Postgres DB (:5433)  │◄──────────────────┘
                                └──────────────────────┘
                                           ▲
                                           │
                                ┌──────────────────────┐
                                │ Redis Stream / Queue │
                                └──────────┬───────────┘
                                           │
         ┌───────────────┬─────────────────┼─────────────────┬───────────────┐
         ▼               ▼                 ▼                 ▼               ▼
  build-worker      test-worker      docker-worker     deploy-worker   script-worker
```

---

## 🌐 Network & Microservices Port Map

| Component / Microservice | Default Port | Internal Proxy / Target URL | Role & Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **API Gateway** (`apps/api`) | `3000` | `http://localhost:3000` | Reverse proxy, JWT authentication (`/auth/login`), CORS & request routing |
| **Pipeline Service** (`services/pipeline`) | `3001` | `http://localhost:3001` | DAG creation, cyclic graph validation, pipeline templates & version storage |
| **Execution Service** (`services/execution`) | `3002` | `http://localhost:3002` | Job queue dispatcher, execution runner, orphan job recovery & analytics |
| **WebSocket Gateway** (`services/websocket`) | `3003` | `ws://localhost:3003` | Real-time node state broadcasting & streaming stdout/stderr log feed |
| **AI Root Cause Analyzer** (`services/ai-analyzer`) | `3004` | `http://localhost:3004` | Event Bus listener classifying failure logs and recommending automated fixes |
| **Notification Service** (`services/notification`) | `3005` | `http://localhost:3005` | Formatted Slack & Discord webhook alerts with execution dispatch logs |
| **GitHub Adapter** (`services/github-adapter`) | `3006` | `http://localhost:3006` | Webhook receiver verifying HMAC signatures & triggering automated runs |
| **Compliance Audit Service** (`services/audit`) | `3007` | `http://localhost:3007` | Immutable security audit trail recording all execution and pipeline events |
| **Web Dashboard** (`apps/dashboard`) | `5173` | `http://localhost:5173` | Interactive visual DAG orchestrator, live execution logs & run controls |
| **Documentation Platform** (`apps/docs`) | `5174` | `http://localhost:5174` | Vite + React developer documentation site with search & API specs |
| **PostgreSQL Database** | `5433` | `localhost:5433` | Persistent relational store managed with Prisma ORM schemas |
| **Redis Streams & BullMQ** | `6379` | `localhost:6379` | Distributed job queues, reactive event broker & heartbeat semaphores |

---

## 📚 Documentation Site

DevFlow includes a full developer documentation platform built with React, Vite, and Tailwind CSS.

- **Live URL:** [https://docs-devflow.vercel.app](https://docs-devflow.vercel.app/)
- **Local Dev:**
  ```bash
  npm run dev -w @devflow/docs
  ```
- **Local URL:** `http://localhost:5174`

---

## ✨ Features & Microservices

- **DAG Engine (`@devflow/graph-engine`)**: Tarjan's cycle hazard detection, diamond DAG validation, and topological sorting.
- **Execution Scheduler (`@devflow/scheduler`)**: BullMQ queue dispatcher with Redis semaphores.
- **Liveness Monitor Recovery (`services/execution`)**: Heartbeat monitor that automatically detects dead workers (15s inactivity) and re-enqueues orphan jobs to standby workers.
- **WebSocket Gateway (`services/websocket` - Port 3003)**: Room-based subscription streaming live stdout/stderr log lines and real-time node state transitions.
- **Specialized Worker Runtime (`@devflow/worker`)**:
  - `build-worker` (`build-queue`)
  - `test-worker` (`test-queue`)
  - `docker-worker` (`docker-queue`)
  - `deploy-worker` (`deploy-queue`)
  - `script-worker` (`script-queue`)
- **Automated Secret Redaction**: Masking engine in worker runtime redacting Bearer tokens, AWS keys, passwords, and API secrets from output streams.
- **AI Root Cause Analyzer (`services/ai-analyzer` - Port 3004)**: Event Bus consumer parsing job failure logs to output root causes and automated fix recommendations.
- **Notification Service (`services/notification` - Port 3005)**: Formatted Slack/Discord/Webhook alert notifications with dispatch history.
- **GitHub Adapter (`services/github-adapter` - Port 3006)**: Webhook parser with HMAC verification and git variable extraction (`COMMIT_SHA`, `BRANCH_NAME`).
- **Compliance Audit Service (`services/audit` - Port 3007)**: Immutable audit trail API (`GET /api/v1/audit`).
- **Pipeline Templates (`@devflow/templates`)**: Pre-configured DAG templates for Node.js, Python, Go, and Java Spring Boot pipelines.
- **Performance Analytics**: Real-time execution throughput, success rates, active workers, and step duration latency breakdown (`GET /api/v1/analytics/performance`).
- **DAG Version Diff Engine**: Structural comparison between pipeline versions (`diffDag`).
- **Log Export & Dry-Run Sandbox**: TXT/JSON log attachments (`GET /logs/export`) and candidate DAG validation (`POST /pipelines/validate`).
- **Modern UI (`apps/dashboard` - Port 5173)**: React Flow + Framer Motion (`motion/react`) spring animations + Tailwind CSS v3 design system.
- **Interactive Documentation (`apps/docs` - Port 5174)**: Production-ready documentation platform with search, dark/light theme, and live API references.

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js v18+
- Docker & Docker Compose
- PostgreSQL (default port `5433` local) & Redis (default port `6379`)

### 2. Installation & Build
```bash
# Clone the repository
git clone https://github.com/Neet2516/DevFlow.git
cd DevFlow

# Install dependencies across all monorepo workspaces
npm install

# Build all packages and services
npm run build
```

### 3. Database Setup (Prisma)
```bash
# Push schema migrations to the database
npm run db:migrate

# (Optional) Open Prisma Studio database viewer
npm run db:studio
```

### 4. Running the Development Environment

Start all microservices, workers, and frontends concurrently:
```bash
# Start all 14 services & background workers
npm run dev

# Or start the core pipeline stack (Gateway, Pipeline, Execution, WS, Dashboard, Build Worker)
npm run dev:core
```

### 5. Production Stack (Docker Compose)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📡 API Reference

All requests can be routed through the API Gateway on port `3000`:

| Endpoint | Method | Service Target | Description |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Gateway (`:3000`) | Gateway health check status |
| `/auth/login` | `POST` | Gateway (`:3000`) | Issue dev JWT bearer authentication token |
| `/api/v1/pipelines` | `POST` / `GET` | Pipeline (`:3001`) | Create and list pipelines |
| `/api/v1/pipelines/:id` | `GET` | Pipeline (`:3001`) | Fetch pipeline configuration and graph definition |
| `/api/v1/pipelines/validate` | `POST` | Pipeline (`:3001`) | Dry-Run Sandbox DAG validation |
| `/api/v1/templates` | `GET` | Pipeline (`:3001`) | Fetch enterprise pipeline templates |
| `/api/v1/pipelines/from-template` | `POST` | Pipeline (`:3001`) | Instantiate pipeline from template |
| `/api/v1/pipelines/:id/executions` | `POST` | Execution (`:3002`) | Trigger new pipeline execution |
| `/api/v1/executions` | `GET` | Execution (`:3002`) | List historical pipeline executions |
| `/api/v1/executions/:id` | `GET` | Execution (`:3002`) | Get execution status and job states |
| `/api/v1/executions/:id/cancel` | `POST` | Execution (`:3002`) | Cancel running execution |
| `/api/v1/executions/:id/restart` | `POST` | Execution (`:3002`) | Restart execution from scratch |
| `/api/v1/executions/:id/logs/export` | `GET` | Execution (`:3002`) | Export execution logs as TXT or JSON |
| `/api/v1/analytics/performance` | `GET` | Execution (`:3002`) | Platform performance & throughput metrics |
| `/api/v1/executions/:id/analysis` | `GET` | AI Analyzer (`:3004`) | Get AI failure root cause analysis |
| `/api/v1/notifications` | `GET` | Notification (`:3005`) | Retrieve notification dispatch audit history |
| `/webhooks/github` | `POST` | GitHub Adapter (`:3006`) | GitHub push/PR HMAC webhook trigger |
| `/api/v1/audit` | `GET` | Audit (`:3007`) | Fetch compliance audit trail |
| `/health/ws` | `GET` | WebSocket (`:3003`) | Check WebSocket gateway health |

---

## 🔌 Real-Time WebSocket Gateway

Clients connect to `ws://localhost:3003` to stream execution outputs in real-time.

### Subscribing to an Execution Room
```json
{
  "type": "subscribe",
  "executionId": "exec-9a4f21"
}
```

### Event Message Types
- `log`: Live stdout/stderr chunks from workers with step metadata.
- `node_state`: Real-time node transition updates (`PENDING` ➔ `RUNNING` ➔ `COMPLETED` / `FAILED`).
- `execution_complete`: Final terminal state payload with total execution duration.

---

## 🧪 Integration & E2E Tests

The Jest test suites validate DAG cycle detection, diamond graph topology, reactive state transitions, AI log classification, webhook payload parsing, secret redaction, DAG diffing, worker crash recovery, and cancellation logic:

```bash
# Run integration test suite
npm run test -w @devflow/tests
```

**Test Coverage Highlights:**
- **Unit Tests (`@devflow/graph-engine`)**: Tarjan cycle validation, DAG dependency diffing.
- **Integration Tests (`tests/integration`)**: Pipeline CRUD, AI log analysis, export sandboxing, webhook HMAC parsing.
- **End-to-End Tests (`tests/e2e`)**: Multi-job orchestration and worker liveness failover recovery.
- **Status:** 41+ passing tests (100% Green).

---

## 🤝 Contributing & Community

We welcome contributions of all kinds! Please check out our open-source governance guidelines:

- 📖 **[Contributing Guide](CONTRIBUTING.md)** — Development setup, monorepo architecture, and PR guidelines.
- 📜 **[Code of Conduct](CODE_OF_CONDUCT.md)** — Community guidelines and pledges.
- 🛡️ **[Security Policy](SECURITY.md)** — Responsible vulnerability reporting guidelines.

---

## 👥 Authors & Maintainers

- **Lead Maintainer:** Neet2516 ([@Neet2516](https://github.com/Neet2516))
- **Contributor:** Navjeet Sinha ([@Navjeet1605-sys](https://github.com/Navjeet1605-sys))

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
