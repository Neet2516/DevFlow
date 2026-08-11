# DevFlow — Distributed CI/CD Workflow Engine 🚀

[![DevFlow CI](https://github.com/Neet2516/DevFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/Neet2516/DevFlow/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-41%20passing-brightgreen.svg)](https://github.com/Neet2516/DevFlow/actions/workflows/ci.yml)
[![Build & Test Suite](https://github.com/Neet2516/DevFlow/actions/workflows/build-test.yml/badge.svg)](https://github.com/Neet2516/DevFlow/actions/workflows/build-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/Neet2516/DevFlow.svg)](https://github.com/Neet2516/DevFlow/graphs/contributors)
[![Open Issues](https://img.shields.io/github/issues/Neet2516/DevFlow.svg)](https://github.com/Neet2516/DevFlow/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](package.json)

**DevFlow** is a modern, high-throughput, fault-tolerant distributed DAG (Directed Acyclic Graph) workflow engine and CI/CD orchestration platform. Built with **TypeScript**, **Node.js**, **Express**, **BullMQ**, **Redis Streams**, **PostgreSQL**, and **React**.

---

## ⚡ Key Features

- 🧠 **DAG Graph Engine (`@devflow/graph-engine`)**: Tarjan's cycle hazard detection, diamond dependency validation, and topological execution ordering.
- ⚡ **Distributed Execution Scheduler**: Parallel job scheduling via BullMQ queues with Redis semaphores and concurrency controls.
- 🩺 **Heartbeat Liveness Recovery**: Automatic detection of inactive or dead workers (15s heartbeat timeout) with zero-downtime job re-enqueueing.
- 📡 **Real-Time Live Streaming Gateway**: Room-based WebSocket streaming for live stdout/stderr log output and node state transitions (`ws://localhost:3003`).
- 🤖 **AI Root Cause Failure Analyzer**: Event-driven log parser analyzing execution failures to output root causes and actionable remediation steps (`:3004`).
- 🛡️ **Automated Secret Masking Engine**: Built-in regex engine redacting AWS keys, Bearer tokens, passwords, and API secrets from output streams.
- 🐙 **GitHub Adapter**: Webhook listener supporting HMAC SHA-256 signatures, branch filters, and automatic git variable injection (`COMMIT_SHA`, `BRANCH_NAME`).
- 📊 **Performance Analytics & Version Diffing**: Real-time execution throughput analytics, step latency metrics, and structural DAG version comparisons.
- 📑 **Enterprise Templates**: Built-in DAG workflow templates for Node.js, Python, Go, and Java Spring Boot pipelines.
- 🎨 **Glassmorphic React Dashboard**: Modern UI powered by React 18, Vite, React Flow, Tailwind CSS v3, and Framer Motion spring animations.

---

## 🧰 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS v3, Framer Motion (`motion/react`), React Flow |
| **API Gateway & Microservices** | Node.js (v18/v20), TypeScript, Express, WebSockets (`ws`), REST APIs |
| **Distributed Queue & State** | BullMQ, Redis Streams (v7), Redis Semaphores |
| **Database & ORM** | PostgreSQL 15/16, Prisma ORM |
| **Worker Runtimes** | Docker, Docker-in-Docker (DinD), Bash / Shell Execution Runtimes |
| **Monitoring & Telemetry** | Prometheus, Grafana, Structured Logger (`@devflow/logger`) |
| **Testing & CI** | Jest, ts-jest, GitHub Actions |

---

## 🏛️ System Architecture & Demo

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

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Docker & Docker Compose** (for PostgreSQL and Redis containers)

### 1. Clone Repository
```bash
git clone https://github.com/Neet2516/DevFlow.git
cd DevFlow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build All Monorepo Packages
```bash
npm run build
```

---

## 🔑 Environment Variables

DevFlow uses a root `.env` configuration for services and local container access.

```bash
# Copy the example environment template to create your .env
cp .env.example .env
```

Detailed environment options in [`.env.example`](.env.example):
- `DATABASE_URL`: PostgreSQL connection string (default local port `5433`).
- `REDIS_URL`: Redis connection string (default port `6379`).
- `JWT_SECRET`: Secret key for API authentication & JWT generation.
- `API_URL` & `WS_URL`: API Gateway (`:3000`) and WebSocket (`:3003`) URLs.
- `GITHUB_WEBHOOK_SECRET`: Secret for GitHub HMAC verification.

---

## 💻 Running Locally

### Option A: Development Stack (Local Microservices)

Make sure PostgreSQL and Redis containers are running:
```bash
docker-compose up -d
```

- **Run All Microservices & Workers Concurrently**:
  ```bash
  npm run dev
  ```

- **Run Core Development Stack** (API Gateway, Pipeline, Execution, WebSocket, Dashboard, and Build Worker):
  ```bash
  npm run dev:core
  ```

- **Access Services**:
  - 🖥️ **Dashboard**: `http://localhost:5173` (or `http://localhost:80` in production)
  - 🌐 **API Gateway**: `http://localhost:3000`
  - ⚡ **WebSocket Gateway**: `ws://localhost:3003`

### Option B: Production Container Stack

Run the full production monorepo stack with Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option C: Run Test Suites

Run unit & integration test suites:
```bash
# Run all monorepo test suites
npm test

# Run integration tests suite specifically
npm run test -w @devflow/tests
```

---

## 📡 API Endpoints Overview

| Endpoint | Method | Service | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/pipelines` | `POST` / `GET` | Pipeline (`:3001`) | Create and list DAG pipelines |
| `/api/v1/pipelines/validate` | `POST` | Pipeline (`:3001`) | Dry-run sandbox DAG validation |
| `/api/v1/templates` | `GET` | Pipeline (`:3001`) | Fetch enterprise pipeline templates |
| `/api/v1/pipelines/from-template` | `POST` | Pipeline (`:3001`) | Instantiate pipeline from template |
| `/api/v1/pipelines/:id/executions` | `POST` | Execution (`:3002`) | Trigger pipeline execution |
| `/api/v1/executions/:id` | `GET` | Execution (`:3002`) | Get execution status & node states |
| `/api/v1/executions/:id/cancel` | `POST` | Execution (`:3002`) | Cancel active execution |
| `/api/v1/executions/:id/restart` | `POST` | Execution (`:3002`) | Restart execution from scratch |
| `/api/v1/executions/:id/logs/export` | `GET` | Execution (`:3002`) | Export execution logs (TXT/JSON) |
| `/api/v1/analytics/performance` | `GET` | Execution (`:3002`) | Platform throughput & latency analytics |
| `/api/v1/executions/:id/analysis` | `GET` | AI Analyzer (`:3004`) | Fetch AI root cause failure diagnosis |
| `/webhooks/github` | `POST` | GitHub Adapter (`:3006`) | GitHub push/PR webhook parser |
| `/api/v1/audit` | `GET` | Audit (`:3007`) | Fetch compliance audit logs |

---

## 🤝 Contributing

Contributions are warmly welcome! Please review our open-source governance guidelines before submitting pull requests:

- 📖 **[Contributing Guide](CONTRIBUTING.md)** — Step-by-step setup, monorepo guide & PR rules.
- 📜 **[Code of Conduct](CODE_OF_CONDUCT.md)** — Community behavior standards.
- 🛡️ **[Security Policy](SECURITY.md)** — Private vulnerability disclosure policy.

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
