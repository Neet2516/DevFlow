# Contributing to DevFlow 🚀

Thank you for your interest in contributing to **DevFlow**! We welcome contributions from developers of all skill levels. Whether you are fixing a bug, adding a new worker runner, optimizing the DAG graph engine, or expanding documentation, your help is greatly appreciated.

---

## 📜 Table of Contents

1. [Code of Conduct](#-code-of-conduct)
2. [How Can I Contribute?](#-how-can-i-contribute)
3. [Development Environment Setup](#-development-environment-setup)
4. [Monorepo Architecture](#-monorepo-architecture)
5. [Development Workflow](#-development-workflow)
6. [Testing Standards](#-testing-standards)
7. [Pull Request Guidelines](#-pull-request-guidelines)
8. [Community & Governance](#-community--governance)

---

## 🤝 Code of Conduct

This project and everyone participating in it is governed by the [DevFlow Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

---

## 🛠️ How Can I Contribute?

- **Report Bugs**: Open a GitHub issue using the Bug Report template.
- **Suggest Features**: Propose new ideas or enhancements using the Feature Request template.
- **Submit Code**: Pick an open issue labeled `good first issue` or `help wanted` and open a Pull Request.
- **Improve Docs**: Enhance existing guides, document API endpoints, or add code examples.

---

## 💻 Development Environment Setup

### 1. Prerequisites
- **Node.js** v18.0.0 or higher (v20 recommended)
- **npm** v9+ (npm workspaces enabled)
- **Docker & Docker Compose** (for PostgreSQL and Redis containers)
- **Git**

### 2. Fork & Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/DevFlow.git
cd DevFlow
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

### 5. Start Infrastructure (Postgres & Redis)
```bash
docker-compose up -d
```

### 6. Build All Monorepo Workspaces
```bash
npm run build
```

---

## 🏗️ Monorepo Architecture

DevFlow is organized as an npm monorepo with clean boundary separation:

```
DevFlow/
├── apps/               # Frontends & Gateway APIs
│   ├── api             # API Gateway (:3000)
│   └── dashboard       # React + Vite + Tailwind UI (:5173 / :80)
├── packages/           # Core Decoupled Modules & Engines
│   ├── auth            # JWT Authentication middleware & helpers
│   ├── db              # Prisma Database client & schema
│   ├── graph-engine    # Tarjan's cycle hazard & DAG validator
│   ├── logger          # Structured logger utility
│   ├── metrics         # Prometheus metrics collectors
│   ├── scheduler       # BullMQ queue dispatcher & semaphores
│   ├── shared          # Shared TypeScript interfaces & types
│   └── templates       # Pre-built DAG pipeline templates
├── services/           # Backend Microservices
│   ├── ai-analyzer     # Event Bus log analyzer (:3004)
│   ├── audit           # Immutable compliance audit log service (:3007)
│   ├── execution       # Execution scheduler & heartbeat liveness monitor (:3002)
│   ├── github-adapter  # GitHub Webhook parser & HMAC validator (:3006)
│   ├── notification    # Alert notification dispatcher (:3005)
│   ├── pipeline        # Pipeline definition management (:3001)
│   └── websocket       # Real-time WebSocket log streaming gateway (:3003)
└── workers/            # Distributed Worker Runtimes
    ├── build-worker    # Executes build job tasks
    ├── deploy-worker   # Executes deployment tasks
    ├── docker-worker   # Container build engine (DinD)
    ├── script-worker   # Custom bash/shell script runner
    └── test-worker     # Test runner worker
```

---

## ⚡ Development Workflow

### Running Services Locally

- **Run Full Dev Stack** (All 14 services and workers concurrently):
  ```bash
  npm run dev
  ```

- **Run Core Dev Stack** (API Gateway, Pipeline, Execution, WebSocket, Dashboard, and Build Worker):
  ```bash
  npm run dev:core
  ```

- **Run a specific workspace**:
  ```bash
  npm run dev -w @devflow/graph-engine
  ```

---

## 🧪 Testing Standards

All pull requests must pass the existing test suite and include tests for new capabilities or bug fixes.

- **Run Monorepo Test Suite**:
  ```bash
  npm test
  ```

- **Run Package Specific Unit Tests**:
  ```bash
  npm test -w @devflow/graph-engine
  ```

- **Run Integration & E2E Suite**:
  ```bash
  npm run test -w @devflow/tests
  ```

---

## 📤 Pull Request Guidelines

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
2. **Follow Commit Message Conventions**:
   Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add Slack notification channel`
   - `fix: resolve cycle detection deadlock in graph engine`
   - `docs: update API gateway endpoints table`
   - `test: add unit tests for token masking engine`

3. **Verify Locally Before Pushing**:
   - Ensure `npm run build` succeeds without TypeScript errors.
   - Ensure `npm test` passes completely.
   - Verify `.env.example` is updated if new environment variables were introduced.

4. **Submit Pull Request**:
   - Open a PR against the `main` branch.
   - Complete the Pull Request checklist in `.github/PULL_REQUEST_TEMPLATE.md`.
   - Link the PR to relevant issue numbers (e.g. `Fixes #123`).

---

## 🌐 Community & Governance

Have questions or need help getting started?
- Join discussions in [GitHub Issues](https://github.com/Neet2516/DevFlow/issues).
- Check existing architectural docs in the [`docs/`](docs/) directory.

Thank you for helping build DevFlow! 🎉
