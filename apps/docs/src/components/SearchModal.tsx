import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, FileText, Hash } from 'lucide-react';
import { allNavItems } from '../data/nav';

// ── Static search index ───────────────────────
const searchIndex = [
  ...allNavItems.map(item => ({
    type: 'page' as const,
    title: item.title,
    href: item.href,
    excerpt: '',
  })),
  // Inline headings / commands
  { type: 'heading' as const, title: 'npm run dev',         href: '/docs/development',   excerpt: 'Run the full dev stack (14 services)' },
  { type: 'heading' as const, title: 'npm run dev:core',    href: '/docs/development',   excerpt: 'Run core services only' },
  { type: 'heading' as const, title: 'npm run build',       href: '/docs/installation',  excerpt: 'Build all monorepo workspaces' },
  { type: 'heading' as const, title: 'npm test',            href: '/docs/testing',       excerpt: 'Run the full test suite' },
  { type: 'heading' as const, title: 'docker-compose up',   href: '/docs/docker',        excerpt: 'Start local infrastructure' },
  { type: 'heading' as const, title: 'DAG cycle detection', href: '/docs/dag-execution', excerpt: "Tarjan's algorithm, DFS-based" },
  { type: 'heading' as const, title: 'POST /api/v1/pipelines', href: '/docs/api/pipelines', excerpt: 'Create a new pipeline' },
  { type: 'heading' as const, title: 'POST /api/v1/pipelines/:id/executions', href: '/docs/api/executions', excerpt: 'Trigger a pipeline execution' },
  { type: 'heading' as const, title: 'GET /api/v1/executions/:id', href: '/docs/api/executions', excerpt: 'Get execution status' },
  { type: 'heading' as const, title: 'BullMQ scheduler',    href: '/docs/scheduler',     excerpt: 'Redis-backed job dispatcher' },
  { type: 'heading' as const, title: 'Redis Streams',       href: '/docs/event-bus',     excerpt: 'Durable event log and fan-out' },
  { type: 'heading' as const, title: 'Secret redaction',    href: '/docs/security',      excerpt: 'Automated log masking' },
  { type: 'heading' as const, title: 'Heartbeat monitor',   href: '/docs/failure-recovery', excerpt: 'Worker liveness detection' },
  { type: 'heading' as const, title: 'AI Root Cause Analysis', href: '/docs/ai-analyzer', excerpt: 'Automated failure analysis' },
  { type: 'heading' as const, title: 'DATABASE_URL',        href: '/docs/configuration', excerpt: 'PostgreSQL connection string' },
  { type: 'heading' as const, title: 'JWT_SECRET',          href: '/docs/configuration', excerpt: 'JWT signing key' },
  { type: 'heading' as const, title: 'REDIS_URL',           href: '/docs/configuration', excerpt: 'Redis connection string' },
];

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length > 0
    ? searchIndex.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 12)
    : searchIndex.filter(i => i.type === 'page').slice(0, 10);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) { onNavigate(results[selected].href); }
    if (e.key === 'Escape') onClose();
  }, [results, selected, onNavigate, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl
                   border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 text-sm
                       placeholder-slate-400 outline-none"
            id="search-input"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={16} />
            </button>
          )}
          <kbd className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700
                          text-slate-400 dark:text-slate-500 font-mono">Esc</kbd>
        </div>

        {/* Results */}
        <ul className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-slate-400 text-sm">
              No results for "{query}"
            </li>
          )}
          {results.map((result, i) => (
            <li key={`${result.href}-${result.title}`}>
              <button
                onClick={() => onNavigate(result.href)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                  ${i === selected
                    ? 'bg-brand-50 dark:bg-brand-950/50'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                {result.type === 'page'
                  ? <FileText size={15} className="shrink-0 text-slate-400" />
                  : <Hash size={15} className="shrink-0 text-brand-500" />
                }
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate
                    ${i === selected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {result.title}
                  </p>
                  {result.excerpt && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{result.excerpt}</p>
                  )}
                </div>
                <span className="ml-auto text-xs text-slate-300 dark:text-slate-600 font-mono shrink-0 hidden sm:block">
                  {result.href.replace('/docs/', '')}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><kbd className="kbd">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="kbd">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="kbd">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
