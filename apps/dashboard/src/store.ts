import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────
export type JobStatus = 'pending' | 'running' | 'succeeded' | 'failed_terminal' | 'skipped' | 'retrying' | 'cancelled';

export interface JobExecution {
  id: string;
  jobId: string;
  status: JobStatus;
  attempt: number;
  workerId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface Execution {
  id: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  jobExecutions: JobExecution[];
}

export interface Pipeline {
  id: string;
  name: string;
  versionId?: string;
  dag?: {
    jobs: Array<{
      id: string;
      name: string;
      type: string;
      dependsOn: string[];
    }>;
  };
}

export interface LogLine {
  jobId: string;
  jobExecutionId: string;
  lineNumber: number;
  line: string;
  timestamp: string;
}

// ─── Store ────────────────────────────────────────────────────────
interface DevFlowState {
  // Pipeline list
  pipelines: Pipeline[];
  setPipelines: (ps: Pipeline[]) => void;

  // Active selection
  activePipelineId: string | null;
  setActivePipelineId: (id: string | null) => void;

  activeExecution: Execution | null;
  setActiveExecution: (e: Execution | null) => void;

  // Live job statuses (keyed by jobId in DAG)
  liveJobStatuses: Record<string, JobStatus>;
  updateJobStatus: (jobId: string, status: JobStatus) => void;
  resetLiveStatuses: () => void;

  // Log lines streamed live
  logLines: LogLine[];
  appendLogLine: (l: LogLine) => void;
  clearLogs: () => void;

  // WS connection state
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;

  // Triggering state
  isTriggeringExecution: boolean;
  setIsTriggeringExecution: (v: boolean) => void;
}

export const useStore = create<DevFlowState>((set) => ({
  pipelines: [],
  setPipelines: (ps) => set({ pipelines: ps }),

  activePipelineId: null,
  setActivePipelineId: (id) => set({ activePipelineId: id }),

  activeExecution: null,
  setActiveExecution: (e) => set({ activeExecution: e }),

  liveJobStatuses: {},
  updateJobStatus: (jobId, status) =>
    set((s) => ({ liveJobStatuses: { ...s.liveJobStatuses, [jobId]: status } })),
  resetLiveStatuses: () => set({ liveJobStatuses: {} }),

  logLines: [],
  appendLogLine: (l) =>
    set((s) => ({ logLines: [...s.logLines.slice(-500), l] })), // cap at 500 lines
  clearLogs: () => set({ logLines: [] }),

  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  isTriggeringExecution: false,
  setIsTriggeringExecution: (v) => set({ isTriggeringExecution: v }),
}));
