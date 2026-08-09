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
    cmd?: string;
    condition?: string;
}
export interface PipelineDAG {
    jobs: JobDefinition[];
}
export type JobExecutionStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'retrying' | 'failed_terminal' | 'cancelled' | 'skipped';
export type ExecutionStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export declare function isValidJobTransition(from: JobExecutionStatus, to: JobExecutionStatus): boolean;
export declare function isValidExecutionTransition(from: ExecutionStatus, to: ExecutionStatus): boolean;
export type EventType = 'execution.started' | 'execution.completed' | 'job.started' | 'job.completed' | 'job.failed' | 'job.retried' | 'job.skipped' | 'log.line';
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
export type DevFlowEvent = ExecutionStartedEvent | ExecutionCompletedEvent | JobStartedEvent | JobCompletedEvent | JobFailedEvent | JobRetriedEvent | JobSkippedEvent | LogLineEvent;
export declare const QUEUES: {
    readonly BUILD: "build-queue";
    readonly TEST: "test-queue";
    readonly DEPLOY: "deploy-queue";
    readonly DOCKER: "docker-queue";
    readonly SCRIPT: "script-queue";
};
export declare const STREAMS: {
    readonly JOB_EVENTS: "job-events";
};
