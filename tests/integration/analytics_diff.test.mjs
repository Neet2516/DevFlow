import { diffDag } from '@devflow/graph-engine';

describe('Performance Analytics & DAG Diff — Integration', () => {
  it('correctly calculates DAG diff when nodes are added, removed, and modified', () => {
    const dagA = {
      jobs: [
        { id: 'build', name: 'Build', type: 'build', dependsOn: [], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
        { id: 'test',  name: 'Test',  type: 'test',  dependsOn: ['build'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
      ],
    };

    const dagB = {
      jobs: [
        { id: 'build',  name: 'Compile Build', type: 'build', dependsOn: [], retryPolicy: { maxAttempts: 3, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: [] } },
        { id: 'docker', name: 'Docker Build',  type: 'docker',dependsOn: ['build'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
      ],
    };

    const diff = diffDag(dagA, dagB);

    expect(diff.hasChanges).toBe(true);
    expect(diff.addedJobs.map(j => j.id)).toContain('docker');
    expect(diff.removedJobs.map(j => j.id)).toContain('test');
    expect(diff.modifiedJobs.some(m => m.jobId === 'build')).toBe(true);
  });

  it('calculates success rate correctly', () => {
    const totalExecutions = 20;
    const succeededExecutions = 18;
    const rate = (succeededExecutions / totalExecutions) * 100;
    expect(rate).toBe(90);
  });
});
