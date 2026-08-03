import { isValidExecutionTransition, isValidJobTransition } from '@devflow/shared';

describe('Pipeline Execution Cancellation — Integration', () => {
  it('validates execution transition from running to cancelled', () => {
    expect(isValidExecutionTransition('running', 'cancelled')).toBe(true);
    expect(isValidExecutionTransition('pending', 'cancelled')).toBe(true);
    expect(isValidExecutionTransition('succeeded', 'cancelled')).toBe(false);
  });

  it('validates job execution transition from running or pending to cancelled', () => {
    expect(isValidJobTransition('running', 'cancelled')).toBe(true);
    expect(isValidJobTransition('pending', 'cancelled')).toBe(true);
    expect(isValidJobTransition('succeeded', 'cancelled')).toBe(false);
  });
});
