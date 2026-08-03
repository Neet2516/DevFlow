import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Download } from 'lucide-react';
import { useStore } from '../store';

// Individual animated log line
const LogLine = memo(({ lineNumber, line }: { lineNumber: number; line: string }) => (
  <motion.div
    className="log-row flex items-start gap-3 font-mono text-[11.5px] py-1 px-3 border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
    layout
  >
    <span className="log-num text-slate-500 font-medium select-none min-w-[28px] text-right">{lineNumber}</span>
    <span className="log-text text-slate-200 leading-relaxed font-mono">{line}</span>
  </motion.div>
));

LogLine.displayName = 'LogLine';

function LogPanel() {
  const logLines = useStore((s) => s.logLines);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logLines.length]);

  return (
    <motion.div
      className="log-panel border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md flex flex-col h-[220px]"
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.1 }}
    >
      <div className="log-panel-header flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <Terminal size={12} className="text-blue-400" />
        Live Output
        <AnimatePresence mode="wait">
          {logLines.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <motion.button
                onClick={() => {
                  const text = logLines.map((l) => `[LINE ${l.lineNumber}] ${l.line}`).join('\n');
                  const blob = new Blob([text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `devflow-logs-${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-semibold transition-colors"
                title="Export Logs TXT"
              >
                <Download size={10} />
                Export Logs
              </motion.button>
              <motion.span
                key="count"
                className="log-count bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {logLines.length} lines
              </motion.span>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="log-scroll flex-1 overflow-y-auto p-1 font-mono">
        <AnimatePresence initial={false}>
          {logLines.length === 0 ? (
            <motion.div
              key="empty"
              className="log-empty flex items-center justify-center gap-2 h-full text-xs text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Terminal size={14} className="opacity-40" />
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
