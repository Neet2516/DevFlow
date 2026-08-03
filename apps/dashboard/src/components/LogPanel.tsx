import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal } from 'lucide-react';
import { useStore } from '../store';

// Individual animated log line
const LogLine = memo(({ lineNumber, line }: { lineNumber: number; line: string }) => (
  <motion.div
    className="log-row"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
    layout
  >
    <span className="log-num">{lineNumber}</span>
    <span className="log-text">{line}</span>
  </motion.div>
));

LogLine.displayName = 'LogLine';

function LogPanel() {
  const logLines = useStore((s) => s.logLines);

  // Auto-scroll via a ref managed outside motion
  const bottomRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logLines.length]);

  return (
    <motion.div
      className="log-panel"
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.1 }}
    >
      <div className="log-panel-header">
        <Terminal size={12} />
        Live Output
        <AnimatePresence mode="wait">
          {logLines.length > 0 && (
            <motion.span
              key="count"
              className="log-count"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {logLines.length} lines
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="log-scroll">
        <AnimatePresence initial={false}>
          {logLines.length === 0 ? (
            <motion.div
              key="empty"
              className="log-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Terminal size={14} style={{ opacity: 0.4 }} />
              Waiting for job output…
            </motion.div>
          ) : (
            logLines.map((l, i) => (
              <LogLine key={`${l.jobExecutionId}-${l.lineNumber}-${i}`} lineNumber={l.lineNumber} line={l.line} />
            ))
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </motion.div>
  );
}

export default memo(LogPanel);
