import { buildDag } from '../src/buildDag';
import { PipelineDAG } from '@devflow/shared';

describe('DAG Validation Engine', () => {
  it('should validate a simple sequential pipeline', () => {
    const dag: PipelineDAG = {
      jobs: [
        {
          id: 'job_1',
          name: 'Build',
          type: 'build',
          dependsOn: [],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        },
        {
          id: 'job_2',
          name: 'Test',
          type: 'test',
          dependsOn: ['job_1'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        }
      ]
    };
    const result = buildDag(dag);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.resolvedOrder).toEqual(['job_1', 'job_2']);
  });

  it('should validate a diamond dependency graph', () => {
    const dag: PipelineDAG = {
      jobs: [
        {
          id: 'A',
          name: 'Build',
          type: 'build',
          dependsOn: [],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        },
        {
          id: 'B',
          name: 'Unit Test',
          type: 'test',
          dependsOn: ['A'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        },
        {
          id: 'C',
          name: 'Integration Test',
          type: 'test',
          dependsOn: ['A'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        },
        {
          id: 'D',
          name: 'Deploy',
          type: 'deploy',
          dependsOn: ['B', 'C'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        }
      ]
    };
    const result = buildDag(dag);
    expect(result.isValid).toBe(true);
    expect(result.resolvedOrder[0]).toBe('A');
    expect(result.resolvedOrder[3]).toBe('D');
    expect(new Set(result.resolvedOrder.slice(1, 3))).toEqual(new Set(['B', 'C']));
  });

  it('should reject direct cycles (self-reference)', () => {
    const dag: PipelineDAG = {
      jobs: [
        {
          id: 'A',
          name: 'Self',
          type: 'build',
          dependsOn: ['A'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        }
      ]
    };
    const result = buildDag(dag);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Cycle detected'))).toBe(true);
  });

  it('should reject cycles of length 2', () => {
    const dag: PipelineDAG = {
      jobs: [
        {
          id: 'A',
          name: 'Job A',
          type: 'build',
          dependsOn: ['B'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        },
        {
          id: 'B',
          name: 'Job B',
          type: 'test',
          dependsOn: ['A'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        }
      ]
    };
    const result = buildDag(dag);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Cycle detected'))).toBe(true);
  });

  it('should reject dangling dependency references', () => {
    const dag: PipelineDAG = {
      jobs: [
        {
          id: 'A',
          name: 'Job A',
          type: 'build',
          dependsOn: ['NON_EXISTENT'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        }
      ]
    };
    const result = buildDag(dag);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('depends on missing job'))).toBe(true);
  });

  it('should reject orphaned/unreachable nodes', () => {
    const dag: PipelineDAG = {
      jobs: [
        {
          id: 'A',
          name: 'Root 1',
          type: 'build',
          dependsOn: [],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        },
        {
          id: 'B',
          name: 'Orphan Child 1',
          type: 'test',
          dependsOn: ['C'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        },
        {
          id: 'C',
          name: 'Orphan Child 2',
          type: 'test',
          dependsOn: ['B'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 100, maxMs: 100 }, retryableExitCodes: 'any' }
        }
      ]
    };
    const result = buildDag(dag);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Orphaned/unreachable jobs found'))).toBe(true);
  });
});
