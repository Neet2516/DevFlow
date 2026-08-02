import { JobDefinition } from '@devflow/shared';

export interface DAGValidationResult {
  isValid: boolean;
  errors: string[];
  cycles: string[][];
  orphanedNodes: string[];
  resolvedOrder: string[]; // Topological sort order
}
