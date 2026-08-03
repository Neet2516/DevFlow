/**
 * @devflow/metrics — Prometheus metrics registry.
 * Implements doc 28-monitoring.md: five metric categories
 * (execution throughput, queue depth, worker health, latency, error rate).
 */
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

export const registry = new Registry();
registry.setDefaultLabels({ app: 'devflow' });

// ── Execution throughput ─────────────────────────────────────────
export const executionsStarted = new Counter({
  name: 'devflow_executions_started_total',
  help: 'Total number of pipeline executions started',
  labelNames: ['pipeline_id'],
  registers: [registry],
});

export const executionsCompleted = new Counter({
  name: 'devflow_executions_completed_total',
  help: 'Total pipeline executions completed',
  labelNames: ['status'],
  registers: [registry],
});

// ── Job throughput ────────────────────────────────────────────────
export const jobsStarted = new Counter({
  name: 'devflow_jobs_started_total',
  help: 'Total jobs started',
  labelNames: ['job_type'],
  registers: [registry],
});

export const jobsCompleted = new Counter({
  name: 'devflow_jobs_completed_total',
  help: 'Total jobs completed',
  labelNames: ['job_type', 'status'],
  registers: [registry],
});

// ── Worker health ─────────────────────────────────────────────────
export const activeWorkers = new Gauge({
  name: 'devflow_active_workers',
  help: 'Number of currently active (idle+busy) workers',
  registers: [registry],
});

export const workerRestarts = new Counter({
  name: 'devflow_worker_restarts_total',
  help: 'Total worker crash-and-reassign events detected by liveness monitor',
  registers: [registry],
});

// ── Queue depth ───────────────────────────────────────────────────
export const queueDepth = new Gauge({
  name: 'devflow_queue_depth',
  help: 'Current job queue depth',
  labelNames: ['queue'],
  registers: [registry],
});

// ── Latency ───────────────────────────────────────────────────────
export const jobDuration = new Histogram({
  name: 'devflow_job_duration_seconds',
  help: 'Job execution duration in seconds',
  labelNames: ['job_type'],
  buckets: [0.1, 0.5, 1, 5, 15, 30, 60, 120, 300],
  registers: [registry],
});

export const apiRequestDuration = new Histogram({
  name: 'devflow_api_request_duration_seconds',
  help: 'HTTP API request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [registry],
});

// ── Error rate ────────────────────────────────────────────────────
export const apiErrors = new Counter({
  name: 'devflow_api_errors_total',
  help: 'Total API error responses (4xx + 5xx)',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});
