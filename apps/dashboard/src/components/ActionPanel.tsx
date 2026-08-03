import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, SkipForward, RefreshCw, ChevronDown, ChevronUp, Bot, AlertTriangle, Lightbulb, Ban } from 'lucide-react';
import { retryJob, skipJob, restartExecution, cancelExecution, fetchAiAnalysis } from '../api';

interface JobExecution {
  id: string;
  jobId: string;
  status: string;
  attempt: number;
}

interface ActionPanelProps {
  executionId: string;
  jobExecutions: JobExecution[];
  onActionDone: () => void;
}

const ACTIONABLE: Record<string, string[]> = {
  failed_terminal: ['retry', 'skip'],
  failed:          ['retry', 'skip'],
  skipped:         ['retry'],
  pending:         ['skip'],
  running:         [],
  succeeded:       [],
  cancelled:       [],
  retrying:        [],
};

export default function ActionPanel({ executionId, jobExecutions, onActionDone }: ActionPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);

  const hasFailedJobs = jobExecutions.some(j => j.status === 'failed_terminal' || j.status === 'failed');

  useEffect(() => {
    if (hasFailedJobs) {
      fetchAiAnalysis(executionId).then(data => {
        if (data) setAiAnalysis(data);
      }).catch(() => {});
    } else {
      setAiAnalysis(null);
    }
  }, [executionId, hasFailedJobs]);

  const actionable = jobExecutions.filter((je) =>
    (ACTIONABLE[je.status] ?? []).length > 0
  );

  const handle = async (fn: () => Promise<any>, key: string) => {
    setLoading(key);
    try {
      await fn();
      onActionDone();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const clientId = (je: JobExecution) => je.jobId.split('_').slice(1).join('_') || je.jobId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* AI Failure Root Cause Insight Banner */}
      <AnimatePresence>
        {aiAnalysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(139,92,246,0.15) 100%)',
              borderBottom: '1px solid rgba(239,68,68,0.3)',
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: '#f87171', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>
              <Bot size={14} style={{ color: '#c084fc' }} />
              AI Failure Root Cause Analysis
              <span style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '1px 7px', borderRadius: 8, fontSize: 10 }}>
                {Math.round((aiAnalysis.confidenceScore || 0.9) * 100)}% Confidence
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc', marginBottom: 4, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <AlertTriangle size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
              {aiAnalysis.rootCause}
            </div>
            <div style={{ fontSize: 11.5, color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: 6, background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 6, marginTop: 6 }}>
              <Lightbulb size={12} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
              <span><strong>Recommendation:</strong> {aiAnalysis.recommendation}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
          fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.8px',
        }}
      >
        <RefreshCw size={12} />
        Job Actions
        {actionable.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              marginLeft: 4, background: 'var(--accent-glow)',
              color: 'var(--accent-light)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700,
            }}
          >
            {actionable.length}
          </motion.span>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      {/* Restart & Cancel execution buttons */}
      <div style={{ padding: '0 12px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <motion.button
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: '5px 12px', gap: 5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading === 'restart'}
          onClick={() => handle(() => restartExecution(executionId), 'restart')}
        >
          {loading === 'restart' ? (
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
              <RefreshCw size={12} />
            </motion.span>
          ) : <RotateCcw size={12} />}
          Restart All
        </motion.button>

        <motion.button
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: '5px 12px', gap: 5, color: '#ef4444' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading === 'cancel'}
          onClick={() => handle(() => cancelExecution(executionId), 'cancel')}
        >
          {loading === 'cancel' ? (
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
              <RefreshCw size={12} />
            </motion.span>
          ) : <Ban size={12} />}
          Cancel Run
        </motion.button>
      </div>

      {/* Per-job actions */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {actionable.length === 0 ? (
              <div style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                No actionable jobs right now.
              </div>
            ) : (
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {actionable.map((je) => {
                  const jid = clientId(je);
                  const actions = ACTIONABLE[je.status] ?? [];
                  return (
                    <motion.div
                      key={je.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {jid}
                      </span>
                      <span className={`status-badge status-${je.status}`} style={{ fontSize: 10 }}>
                        {je.status}
                      </span>
                      {actions.includes('retry') && (
                        <motion.button
                          className="btn btn-ghost"
                          style={{ fontSize: 11, padding: '3px 8px', gap: 4 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={loading === `retry-${je.id}`}
                          onClick={() => handle(() => retryJob(executionId, jid), `retry-${je.id}`)}
                        >
                          <RotateCcw size={10} />
                          Retry
                        </motion.button>
                      )}
                      {actions.includes('skip') && (
                        <motion.button
                          className="btn btn-ghost"
                          style={{ fontSize: 11, padding: '3px 8px', gap: 4, color: 'var(--warning)' }}
                          whileTap={{ scale: 0.95 }}
                          disabled={loading === `skip-${je.id}`}
                          onClick={() => handle(() => skipJob(executionId, jid), `skip-${je.id}`)}
                        >
                          <SkipForward size={10} />
                          Skip
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
