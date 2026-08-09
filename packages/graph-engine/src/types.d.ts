export interface DAGValidationResult {
    isValid: boolean;
    errors: string[];
    cycles: string[][];
    orphanedNodes: string[];
    resolvedOrder: string[];
}
