import React, { memo } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useStore } from '../store';

const STATUS_LABEL: Record<string, string> = {
  pending:         'Pending',
  running:         'Running',
  succeeded:       'Done',
  failed_terminal: 'Failed',
  failed:          'Failed',
  skipped:         'Skipped',
  retrying:        'Retrying',
  cancelled:       'Cancelled',
};

const STATUS_ICON: Record<string, string> = {
  pending:         '○',
  running:         '◉',
  succeeded:       '✓',
  failed_terminal: '✕',
  failed:          '✕',
  skipped:         '⤳',
  retrying:        '↺',
  cancelled:       '⊘',
};

function DagNode({ data }: NodeProps) {
  const label     = (data as any).label as string;
  const type      = (data as any).type  as string;
  const jobId     = (data as any).jobId as string;

  const liveStatus = useStore((s) => s.liveJobStatuses[jobId]);
  const baseStatus = (data as any).status as string;
  const status: string = liveStatus || baseStatus || 'pending';

  return (
    <motion.div
      className={`dag-node status-${status} relative flex flex-col min-w-[180px] p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-md shadow-xl transition-all hover:border-blue-500/50 hover:shadow-blue-500/10`}
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      layout
    >
      {/* Top accent bar */}
      <div className="dag-node-accent absolute top-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />

      <Handle type="target" position={Position.Left} />

      <div className="dag-node-type text-[10px] font-bold tracking-wider uppercase text-blue-400 mb-1">{type}</div>
      <div className="dag-node-name text-xs font-semibold text-slate-100 mb-2 truncate">{label}</div>

      {/* Animated status badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          className={`status-badge status-${status}`}
          initial={{ opacity: 0, y: 4, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          {status === 'running' ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
              style={{ display: 'inline-block', fontSize: 11 }}
            >
              ◉
            </motion.span>
          ) : (
            <span style={{ fontSize: 11 }}>{STATUS_ICON[status] ?? '○'}</span>
          )}
          {STATUS_LABEL[status] || status}
        </motion.div>
      </AnimatePresence>

      {/* Running pulse ring */}
      <AnimatePresence>
        {status === 'running' && (
          <motion.div
            key="pulse"
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid rgba(59,130,246,0.5)',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.08 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <Handle type="source" position={Position.Right} />
    </motion.div>
  );
}

export default memo(DagNode);
