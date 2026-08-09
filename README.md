# DevFlow — Distributed CI/CD Workflow Engine 🚀

[![DevFlow CI](https://github.com/Neet2516/DevFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/Neet2516/DevFlow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](package.json)

DevFlow is a modern, high-throughput, fault-tolerant distributed DAG workflow and CI/CD engine built with Node.js, TypeScript, Express, BullMQ, Redis Streams, PostgreSQL, and React.

---

## 🏛️ System Architecture

```
                               ┌──────────────────────────┐
                               │  React + Vite Dashboard  │
                               │   (Tailwind + Motion)    │
                               └────────────┬─────────────┘
                                            │ HTTP / WebSocket (3003)
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
           │                               ▼                               │
           │                    ┌──────────────────────┐                   │
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
- **Notification Service (`services/notification` - Port 3005)**: Formatted Slack/Discord/Webhook alert notifications.
- **GitHub Adapter (`services/github-adapter` - Port 3006)**: Webhook parser with HMAC verification and git variable extraction (`COMMIT_SHA`, `BRANCH_NAME`).
- **Compliance Audit Service (`services/audit` - Port 3007)**: Immutable audit trail API (`GET /api/v1/audit`).
- **Pipeline Templates (`@devflow/templates`)**: Pre-configured DAG templates for Node.js, Python, Go, and Java Spring Boot pipelines.
- **Performance Analytics**: Real-time execution throughput, success rates, active workers, and step duration latency breakdown (`GET /api/v1/analytics/performance`).
- **DAG Version Diff Engine**: Structural comparison between pipeline versions (`diffDag`).
- **Log Export & Dry-Run Sandbox**: TXT/JSON log attachments (`GET /logs/export`) and candidate DAG validation (`POST /pipelines/validate`).
- **Modern UI (`apps/dashboard` - Port 5173)**: React Flow + Framer Motion (`motion/react`) spring animations + Tailwind CSS v3 glassmorphic design system.

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js v18+
- Docker & Docker Compose
- PostgreSQL (default port `5433` local) & Redis (default port `6379`)

### 2. Installation & Build
```bash
# Install dependencies
npm install

# Build all monorepo packages and microservices
npm run build
```

### 3. Run Integration Test Suite
```bash
npm run test -w @devflow/tests
```

### 4. Production Stack (Docker Compose)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📡 API Reference

| Endpoint | Method | Service | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/pipelines` | `POST` / `GET` | Pipeline (`:3001`) | Create and list pipelines |
| `/api/v1/pipelines/validate` | `POST` | Pipeline (`:3001`) | Dry-Run Sandbox DAG validation |
| `/api/v1/templates` | `GET` | Pipeline (`:3001`) | Fetch enterprise pipeline templates |
| `/api/v1/pipelines/from-template` | `POST` | Pipeline (`:3001`) | Instantiate pipeline from template |
| `/api/v1/pipelines/:id/executions` | `POST` | Execution (`:3002`) | Trigger pipeline execution |
| `/api/v1/executions/:id` | `GET` | Execution (`:3002`) | Get execution status and job states |
| `/api/v1/executions/:id/cancel` | `POST` | Execution (`:3002`) | Cancel running execution |
| `/api/v1/executions/:id/restart` | `POST` | Execution (`:3002`) | Restart execution from scratch |
| `/api/v1/executions/:id/logs/export` | `GET` | Execution (`:3002`) | Export execution logs as TXT or JSON |
| `/api/v1/analytics/performance` | `GET` | Execution (`:3002`) | Get platform performance analytics |
| `/api/v1/executions/:id/analysis` | `GET` | AI Analyzer (`:3004`) | Get AI failure root cause analysis |
| `/webhooks/github` | `POST` | GitHub Adapter (`:3006`) | GitHub push/PR webhook trigger |
| `/api/v1/audit` | `GET` | Audit (`:3007`) | Fetch compliance audit trail |

---

## 🧪 Integration Tests

The Jest integration suite validates DAG cycle detection, reactive state transitions, AI log classification, webhook payload parsing, secret redaction, DAG diffing, and cancellation logic:

```bash
npm run test -w @devflow/tests
# Result: 35 / 35 Tests Passed (100% Green)
```

---

## 🤝 Contributing & Community

We welcome contributions of all kinds! Please check out our open-source governance guidelines:

- 📖 **[Contributing Guide](CONTRIBUTING.md)** — Development setup, monorepo architecture, and PR guidelines.
- 📜 **[Code of Conduct](CODE_OF_CONDUCT.md)** — Community guidelines and pledges.
- 🛡️ **[Security Policy](SECURITY.md)** — Responsible vulnerability reporting guidelines.

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

