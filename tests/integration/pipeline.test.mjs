/**
 * Integration test: Pipeline Creation + DAG Validation
 * Tests the core graph-engine logic that underpins all pipeline execution.
 * These are pure-logic tests requiring no running services.
 */

describe('DAG Validation — Integration', () => {
  let buildDag;

  beforeAll(async () => {
    // Dynamic import to handle ESM workspace package
    const mod = await import('@devflow/graph-engine');
    buildDag = mod.buildDag;
  });

  it('accepts a valid linear pipeline', () => {
    const result = buildDag({
      jobs: [
        { id: 'build', name: 'Build', type: 'build', dependsOn: [], retryPolicy: { maxAttempts: 3, backoff: { type: 'exponential', baseMs: 1000, maxMs: 30000 }, retryableExitCodes: 'any' } },
        { id: 'test',  name: 'Test',  type: 'test',  dependsOn: ['build'], retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 500, maxMs: 5000 }, retryableExitCodes: [1] } },
        { id: 'deploy',name: 'Deploy',type: 'deploy',dependsOn: ['test'],  retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
      ],
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.cycles).toHaveLength(0);
  });

  it('accepts a diamond DAG', () => {
    const result = buildDag({
      jobs: [
        { id: 'a', name: 'A', type: 'build',  dependsOn: [],         retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
        { id: 'b', name: 'B', type: 'test',   dependsOn: ['a'],      retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
        { id: 'c', name: 'C', type: 'test',   dependsOn: ['a'],      retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
        { id: 'd', name: 'D', type: 'deploy', dependsOn: ['b', 'c'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
      ],
    });
    expect(result.isValid).toBe(true);
  });

  it('rejects a direct self-reference cycle', () => {
    const result = buildDag({
      jobs: [
        { id: 'a', name: 'A', type: 'build', dependsOn: ['a'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
      ],
    });
    expect(result.isValid).toBe(false);
    expect(result.cycles.length).toBeGreaterThan(0);
  });

  it('rejects a two-node cycle', () => {
    const result = buildDag({
      jobs: [
        { id: 'a', name: 'A', type: 'build', dependsOn: ['b'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
        { id: 'b', name: 'B', type: 'test',  dependsOn: ['a'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
      ],
    });
    expect(result.isValid).toBe(false);
    expect(result.cycles.length).toBeGreaterThan(0);
  });

  it('rejects a three-node cycle', () => {
    const result = buildDag({
      jobs: [
        { id: 'a', name: 'A', type: 'build',  dependsOn: ['c'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
        { id: 'b', name: 'B', type: 'test',   dependsOn: ['a'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
        { id: 'c', name: 'C', type: 'deploy', dependsOn: ['b'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
      ],
    });
    expect(result.isValid).toBe(false);
  });

  it('rejects a DAG with dangling dependency reference', () => {
    const result = buildDag({
      jobs: [
        { id: 'a', name: 'A', type: 'build', dependsOn: ['nonexistent'], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
      ],
    });
    expect(result.isValid).toBe(false);
  });

  it('handles empty pipeline gracefully', () => {
    const result = buildDag({ jobs: [] });
    expect(result).toBeDefined();
  });

  it('rejects duplicate job IDs', () => {
    const result = buildDag({
      jobs: [
        { id: 'a', name: 'A1', type: 'build', dependsOn: [], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
        { id: 'a', name: 'A2', type: 'build', dependsOn: [], retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] } },
      ],
    });
    expect(result.isValid).toBe(false);
  });
});

describe('State Machine Transitions — Unit', () => {
  let isValidJobTransition;
  let isValidExecutionTransition;

  beforeAll(async () => {
    const mod = await import('@devflow/shared');
    isValidJobTransition = mod.isValidJobTransition;
    isValidExecutionTransition = mod.isValidExecutionTransition;
  });

  describe('Job transitions', () => {
    it('pending → running (valid)', () => expect(isValidJobTransition('pending', 'running')).toBe(true));
    it('running → succeeded (valid)', () => expect(isValidJobTransition('running', 'succeeded')).toBe(true));
    it('running → failed (valid)', () => expect(isValidJobTransition('running', 'failed')).toBe(true));
    it('failed → retrying (valid)', () => expect(isValidJobTransition('failed', 'retrying')).toBe(true));
    it('failed → failed_terminal (valid)', () => expect(isValidJobTransition('failed', 'failed_terminal')).toBe(true));
    it('succeeded → running (invalid)', () => expect(isValidJobTransition('succeeded', 'running')).toBe(false));
    it('failed_terminal → running (invalid)', () => expect(isValidJobTransition('failed_terminal', 'running')).toBe(false));
    it('pending → succeeded (invalid — must go through running)', () => expect(isValidJobTransition('pending', 'succeeded')).toBe(false));
  });

  describe('Execution transitions', () => {
    it('pending → running (valid)', () => expect(isValidExecutionTransition('pending', 'running')).toBe(true));
    it('running → succeeded (valid)', () => expect(isValidExecutionTransition('running', 'succeeded')).toBe(true));
    it('running → failed (valid)', () => expect(isValidExecutionTransition('running', 'failed')).toBe(true));
    it('succeeded → running (invalid)', () => expect(isValidExecutionTransition('succeeded', 'running')).toBe(false));
    it('failed → running (invalid)', () => expect(isValidExecutionTransition('failed', 'running')).toBe(false));
  });
});
