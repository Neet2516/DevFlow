// Core Domain Types
export type JobType = 'build' | 'test' | 'deploy' | 'docker' | 'script';

export interface RetryPolicy {
  maxAttempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    baseMs: number;
    maxMs: number;
  };
  retryableExitCodes: number[] | 'any';
}

export interface JobDefinition {
  id: string;
  name: string;
  type: JobType;
  dependsOn: string[];
  retryPolicy: RetryPolicy;
  condition?: string; // Optional expression evaluated before running
}

export interface PipelineDAG {
  jobs: JobDefinition[];
}

// State Machine Types
export type JobExecutionStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'retrying'
  | 'failed_terminal'
  | 'cancelled'
  | 'skipped';

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

// State Transition Validators
const JOB_TRANSITIONS: Record<JobExecutionStatus, Set<JobExecutionStatus>> = {
  pending: new Set(['running', 'skipped', 'cancelled']),
  running: new Set(['succeeded', 'failed', 'cancelled']),
  failed: new Set(['retrying', 'failed_terminal']),
  retrying: new Set(['running', 'cancelled']),
  succeeded: new Set([]),
  failed_terminal: new Set([]),
  cancelled: new Set([]),
  skipped: new Set([]),
};

const EXECUTION_TRANSITIONS: Record<ExecutionStatus, Set<ExecutionStatus>> = {
  pending: new Set(['running', 'cancelled']),
  running: new Set(['succeeded', 'failed', 'cancelled']),
  succeeded: new Set([]),
  failed: new Set([]),
  cancelled: new Set([]),
};

export function isValidJobTransition(
  from: JobExecutionStatus,
  to: JobExecutionStatus
): boolean {
  return JOB_TRANSITIONS[from]?.has(to) ?? false;
}

export function isValidExecutionTransition(
  from: ExecutionStatus,
  to: ExecutionStatus
): boolean {
  return EXECUTION_TRANSITIONS[from]?.has(to) ?? false;
}

// Event Types for Event Bus
export type EventType =
  | 'execution.started'
  | 'execution.completed'
  | 'job.started'
  | 'job.completed'
  | 'job.failed'
  | 'job.retried'
  | 'job.skipped'
  | 'log.line';

export interface BaseEvent {
  pipelineId: string;
  executionId: string;
  sequence: number;
  timestamp: string;
}

export interface ExecutionStartedEvent extends BaseEvent {
  type: 'execution.started';
}

export interface ExecutionCompletedEvent extends BaseEvent {
  type: 'execution.completed';
  status: 'succeeded' | 'failed' | 'cancelled';
}

export interface JobStartedEvent extends BaseEvent {
  type: 'job.started';
  jobId: string;
  jobExecutionId: string;
  attempt: number;
  workerId: string;
}

export interface JobCompletedEvent extends BaseEvent {
  type: 'job.completed';
  jobId: string;
  jobExecutionId: string;
  attempt: number;
  exitCode: number;
  output?: string;
}

export interface JobFailedEvent extends BaseEvent {
  type: 'job.failed';
  jobId: string;
  jobExecutionId: string;
  attempt: number;
  exitCode: number;
  error: string;
}

export interface JobRetriedEvent extends BaseEvent {
  type: 'job.retried';
  jobId: string;
  jobExecutionId: string;
  attempt: number;
  nextAttemptDelayMs: number;
}

export interface JobSkippedEvent extends BaseEvent {
  type: 'job.skipped';
  jobId: string;
  jobExecutionId: string;
  reason: string;
}

export interface LogLineEvent extends BaseEvent {
  type: 'log.line';
  jobId: string;
  jobExecutionId: string;
  lineNumber: number;
  line: string;
}

export type DevFlowEvent =
  | ExecutionStartedEvent
  | ExecutionCompletedEvent
  | JobStartedEvent
  | JobCompletedEvent
  | JobFailedEvent
  | JobRetriedEvent
  | JobSkippedEvent
  | LogLineEvent;

// Queue & Stream Names
export const QUEUES = {
  BUILD: 'build-queue',
  TEST: 'test-queue',
  DEPLOY: 'deploy-queue',
  DOCKER: 'docker-queue',
  SCRIPT: 'script-queue',
} as const;

export const STREAMS = {
  JOB_EVENTS: 'job-events',
} as const;

