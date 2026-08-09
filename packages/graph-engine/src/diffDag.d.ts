import { PipelineDAG, JobDefinition } from '@devflow/shared';
export interface DagDiffResult {
    addedJobs: JobDefinition[];
    removedJobs: JobDefinition[];
    modifiedJobs: Array<{
        jobId: string;
        changes: string[];
    }>;
    hasChanges: boolean;
}
export declare function diffDag(dagA: PipelineDAG, dagB: PipelineDAG): DagDiffResult;
