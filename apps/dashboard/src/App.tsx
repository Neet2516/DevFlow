import React, { useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  Zap, Play, RefreshCw, GitBranch, Layers, Wifi, WifiOff, Activity, ChevronRight,
} from 'lucide-react';
import DagCanvas from './components/DagCanvas';
import LogPanel from './components/LogPanel';
import ActionPanel from './components/ActionPanel';
import { useStore } from './store';
import { useWebSocket } from './useWebSocket';
import { fetchPipelines, fetchPipeline, fetchExecution, triggerExecution, restartExecution } from './api';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5_000 } },
});

// ─── Animation variants ───────────────────────────────────────────
const sidebarItem: Variants = {
  hidden:  { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.05, type: 'spring', stiffness: 300, damping: 24 },
  }),
};

const fadeSlideUp: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

// ─── Header ───────────────────────────────────────────────────────
function Header() {
  const wsConnected = useStore((s) => s.wsConnected);

  return (
    <motion.header
      className="header"
      initial={{ y: -58 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
    >
      <div className="brand">
        <motion.div
          className="brand-icon"
          whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          ⚡
        </motion.div>
        <span className="brand-name">DevFlow</span>
      </div>

      <motion.div
        className="live-badge"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="live-dot" />
        Live
      </motion.div>

      <div className="header-spacer" />

      <AnimatePresence mode="wait">
        <motion.div
          key={wsConnected ? 'on' : 'off'}
          className={`ws-indicator ${wsConnected ? 'connected' : ''}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          {wsConnected
            ? <><Wifi size={13} /> WS Connected</>
            : <><WifiOff size={13} /> WS Offline</>}
        </motion.div>
      </AnimatePresence>
    </motion.header>
  );
}

// ─── Sidebar pipeline card ────────────────────────────────────────
function PipelineCard({
  pipeline, isActive, onClick, index,
}: {
  pipeline: { id: string; name: string };
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={sidebarItem}
      initial="hidden"
      animate="visible"
      className={`pipeline-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className="pipeline-card-name">
        <GitBranch size={12} style={{ display: 'inline', marginRight: 7, opacity: 0.6 }} />
        {pipeline.name}
      </div>
      <div className="pipeline-card-id">#{pipeline.id.slice(-8)}</div>
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          style={{ position: 'absolute', right: 10, top: '50%', color: 'var(--accent-light)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ChevronRight size={14} />
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Trigger button ───────────────────────────────────────────────
function TriggerButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <motion.button
      className="btn btn-primary"
      onClick={onClick}
      disabled={loading}
      whileHover={loading ? {} : { scale: 1.04 }}
      whileTap={loading ? {} : { scale: 0.96 }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block' }}
            >
              <RefreshCw size={13} />
            </motion.span>
            Triggering…
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Play size={13} />
            Trigger Run
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────
function Dashboard() {
  const {
    pipelines, setPipelines,
    activePipelineId, setActivePipelineId,
    activeExecution, setActiveExecution,
    resetLiveStatuses, clearLogs,
    isTriggeringExecution, setIsTriggeringExecution,
  } = useStore();

  useWebSocket(activeExecution?.id ?? null);

  const { data: executionData } = useQuery({
    queryKey: ['execution', activeExecution?.id],
    queryFn: () => fetchExecution(activeExecution!.id),
    enabled: !!activeExecution?.id,
    refetchInterval: 2_000,
  });
  useEffect(() => { if (executionData) setActiveExecution(executionData); }, [executionData]);

  const { data: pipelineList, isLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: fetchPipelines,
    refetchInterval: 10_000,
  });
  useEffect(() => { if (pipelineList) setPipelines(pipelineList); }, [pipelineList]);

  const { data: pipelineDetail } = useQuery({
    queryKey: ['pipeline', activePipelineId],
    queryFn: () => fetchPipeline(activePipelineId!),
    enabled: !!activePipelineId,
  });

  const selectPipeline = (id: string) => {
    setActivePipelineId(id);
    setActiveExecution(null);
    resetLiveStatuses();
    clearLogs();
  };

  const handleTrigger = async () => {
    if (!activePipelineId) return;
    setIsTriggeringExecution(true);
    resetLiveStatuses();
    clearLogs();
    try {
      const { executionId } = await triggerExecution(activePipelineId);
      const exec = await fetchExecution(executionId);
      setActiveExecution(exec);
    } catch (e) {
      console.error('Trigger failed:', e);
    } finally {
      setIsTriggeringExecution(false);
    }
  };

  const dag = pipelineDetail?.dag || pipelineDetail?.versions?.[0]?.dagJson;
  const jobs: any[] = dag?.jobs ?? [];
  const jobExecutions = activeExecution?.jobExecutions ?? [];

  return (
    <div className="app-shell">
      <Header />

      <div className="workspace">
        {/* ── Sidebar ── */}
        <motion.aside
          className="sidebar"
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <div className="sidebar-top">
            <div className="sidebar-label">
              <Layers size={11} />
              Pipelines
              {!isLoading && pipelines.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    marginLeft: 'auto',
                    background: 'var(--accent-glow)',
                    color: 'var(--accent-light)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 10,
                    padding: '1px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {pipelines.length}
                </motion.span>
              )}
            </div>
          </div>

          <div className="pipeline-list">
            {isLoading && (
              <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw size={13} />
                </motion.span>
                Loading…
              </div>
            )}

            <AnimatePresence>
              {pipelines.map((p, i) => (
                <PipelineCard
                  key={p.id}
                  pipeline={p}
                  isActive={activePipelineId === p.id}
                  onClick={() => selectPipeline(p.id)}
                  index={i}
                />
              ))}
            </AnimatePresence>

            {!isLoading && pipelines.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}
              >
                No pipelines yet.<br />
                <span style={{ fontSize: 11, opacity: 0.6 }}>POST /api/v1/pipelines to create one.</span>
              </motion.div>
            )}
          </div>
        </motion.aside>

        {/* ── Canvas ── */}
        <div className="canvas-area">
          <motion.div
            className="toolbar"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              <motion.h2
                key={pipelineDetail?.name || 'none'}
                className="toolbar-title"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {pipelineDetail?.name || (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Select a pipeline</span>
                )}
              </motion.h2>
            </AnimatePresence>

            <AnimatePresence>
              {activeExecution && (
                <motion.div
                  className={`status-badge status-${activeExecution.status}`}
                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Activity size={10} />
                  {activeExecution.status}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="toolbar-spacer" />

            <AnimatePresence>
              {activePipelineId && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                >
                  <TriggerButton loading={isTriggeringExecution} onClick={handleTrigger} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* DAG + Action panel side-by-side or stacked */}
          <AnimatePresence mode="wait">
            {jobs.length > 0 ? (
              <motion.div
                key="dag"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DagCanvas jobs={jobs} jobExecutions={jobExecutions} />
                {/* Action panel floats over canvas bottom-right */}
                {activeExecution && (
                  <div style={{ position: 'absolute', bottom: 12, right: 12, width: 340, zIndex: 20 }}>
                    <ActionPanel
                      executionId={activeExecution.id}
                      jobExecutions={jobExecutions}
                      onActionDone={async () => {
                        const updated = await fetchExecution(activeExecution.id);
                        setActiveExecution(updated);
                      }}
                    />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="empty-canvas"
                style={{ flex: 1 }}
                variants={fadeSlideUp}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div
                  className="empty-canvas-icon"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Zap size={28} style={{ color: 'var(--accent)' }} />
                </motion.div>
                <h3>No DAG to display</h3>
                <p>Select a pipeline from the sidebar to visualise its execution graph.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <LogPanel />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
