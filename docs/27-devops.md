# 27 — DevOps

## Purpose
Define how DevFlow is built, containerized, and deployed — including how DevFlow dogfoods its own CI/CD via GitHub Actions.

## Responsibilities
- Docker images for each deployable unit (`apps/dashboard`, `apps/api`, each `workers/*`).
- Docker Compose for local development parity.
- GitHub Actions pipeline for lint/test/build/deploy of DevFlow itself.
- Nginx as reverse proxy and TLS/WebSocket termination point.

## Design Decisions
- **One Dockerfile per deployable unit, multi-stage builds** — keeps worker images lean (no frontend build tooling baked into `deploy-worker`, no worker runtime baked into `dashboard`) which matters both for image pull time and for keeping each container's attack surface minimal.
- **Docker Compose as the single source of local-dev truth** — every service, plus Postgres/Redis/Nginx, is defined in one `docker-compose.yml` so `docker compose up` reproduces the full system locally, avoiding "works in prod, broken locally" drift.
- **Nginx terminates WebSocket upgrades** and routes `/ws` to the WebSocket Gateway service, `/api` to the API service, and everything else to the Dashboard — a single ingress point simplifies TLS management and CORS configuration.

## Internal Components
```
infrastructure/
  docker/
    dashboard.Dockerfile
    api.Dockerfile
    worker.Dockerfile
  nginx/
    nginx.conf
  monitoring/
    prometheus.yml
    grafana/
```

## Data Flow (CI/CD)
Push to `main` → GitHub Actions runs lint + unit tests → build Docker images → push to registry → deploy step updates running services (rolling restart, health-checked). This is intentionally the *simplest possible* version of what DevFlow itself orchestrates for its users — useful both as dogfooding and as a living example pipeline for demos.

## Advantages
Multi-stage Docker builds and a single Compose file keep the gap between "how a new engineer runs this locally" and "how it runs in production" as small as possible.

## Trade-offs
Nginx as a single ingress point is a scaling constraint at very high traffic — acceptable at target scale (300+ concurrent users) and revisited only if that ceiling is approached (see `26-scalability.md`).

## Edge Cases
WebSocket connections must survive a rolling deploy of the Gateway service without silently dropping — deploy strategy uses connection draining (stop accepting new connections, let existing ones finish or client-reconnect) rather than hard kill.

## Possible Improvements
Move from Docker Compose to Kubernetes manifests once worker autoscaling (per `37-future-improvements.md`) becomes a requirement.

## Best Practices
Every image is tagged with the Git SHA, never `latest`, so deployments are always traceable to an exact commit.

## References
`04-tech-stack.md`, `28-monitoring.md`, `26-scalability.md`
