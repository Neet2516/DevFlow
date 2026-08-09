import { PipelineDAG } from '@devflow/shared';
import { DAGValidationResult } from './types.js';
/**
 * Builds and validates a pipeline DAG.
 * @param dag Pipeline DAG definition from database or user request.
 * @returns Validation result containing errors, cycles, orphaned nodes, and resolved topological order.
 */
export declare function buildDag(dag: PipelineDAG): DAGValidationResult;
