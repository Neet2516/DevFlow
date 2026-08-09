/**
 * Detects cycles in a directed graph of jobs.
 * @param jobs List of jobs with their IDs and dependencies.
 * @returns Array of cycles, where each cycle is represented as an array of job IDs.
 */
export declare function detectCycles(jobs: {
    id: string;
    dependsOn: string[];
}[]): string[][];
