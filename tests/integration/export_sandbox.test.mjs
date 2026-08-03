import { buildDag } from '@devflow/graph-engine';

describe('Log Export & Dry-Run Sandbox — Integration', () => {
  it('formats execution log exports cleanly for plain text downloads', () => {
    const mockExecution = {
      id: 'exec_test_123',
      pipelineVersionId: 'ver_456',
      status: 'succeeded',
      startedAt: new Date('2026-08-04T00:00:00Z'),
      finishedAt: new Date('2026-08-04T00:01:00Z'),
      jobExecutions: [
        { jobId: 'job_build', status: 'succeeded', attempt: 1, workerId: 'build-worker-1' },
        { jobId: 'job_test',  status: 'succeeded', attempt: 1, workerId: 'test-worker-1' },
      ],
    };

    const textOutput = [
      `=== DevFlow Execution Log Export ===`,
      `Execution ID: ${mockExecution.id}`,
      `Pipeline Version: ${mockExecution.pipelineVersionId}`,
      `Status: ${mockExecution.status}`,
      `Started At: ${mockExecution.startedAt.toISOString()}`,
      `Finished At: ${mockExecution.finishedAt.toISOString()}`,
      ``,
      `--- Job Executions ---`,
      ...mockExecution.jobExecutions.map(j =>
        `[JOB] ${j.jobId} | Status: ${j.status} | Attempt: ${j.attempt} | Worker: ${j.workerId || 'none'}`
      ),
    ].join('\n');

    expect(textOutput).toContain('=== DevFlow Execution Log Export ===');
    expect(textOutput).toContain('[JOB] job_build | Status: succeeded');
    expect(textOutput).toContain('[JOB] job_test | Status: succeeded');
  });

  it('validates candidate pipeline DAG in Dry-Run Sandbox mode', () => {
    const validDag = {
      jobs: [
        { id: 'job_1', name: 'Step 1', type: 'build', dependsOn: [], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
        { id: 'job_2', name: 'Step 2', type: 'test',  dependsOn: ['job_1'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
      ],
    };

    const validation = buildDag(validDag);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.cycles).toHaveLength(0);
  });
});
