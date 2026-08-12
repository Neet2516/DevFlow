import { diffDag } from '../src/diffDag';
import { PipelineDAG } from '@devflow/shared';

describe('diffDag', () => {
  it('should not mutate dependency arrays in the input DAGs', () => {
    const dagA: PipelineDAG = {
      jobs: [
        {
          id: 'build',
          name: 'Build',
          type: 'build',
          dependsOn: ['test', 'deploy'],
          retryPolicy: {
            maxAttempts: 1,
            backoff: {
              type: 'fixed',
              baseMs: 1000,
              maxMs: 5000,
            },
            retryableExitCodes: [],
          },
        },
      ],
    };

    const dagB: PipelineDAG = {
      jobs: [
        {
          id: 'build',
          name: 'Build',
          type: 'build',
          dependsOn: ['deploy', 'test'],
          retryPolicy: {
            maxAttempts: 1,
            backoff: {
              type: 'fixed',
              baseMs: 1000,
              maxMs: 5000,
            },
            retryableExitCodes: [],
          },
        },
      ],
    };

    const originalDagADependencies = [...dagA.jobs[0].dependsOn];
    const originalDagBDependencies = [...dagB.jobs[0].dependsOn];

    diffDag(dagA, dagB);

    expect(dagA.jobs[0].dependsOn).toEqual(originalDagADependencies);
    expect(dagB.jobs[0].dependsOn).toEqual(originalDagBDependencies);
  });
});