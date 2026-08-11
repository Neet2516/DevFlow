import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const LABELS: Record<string, string> = {
  docs: 'Docs',
  introduction: 'Introduction',
  quickstart: 'Quick Start',
  installation: 'Installation',
  requirements: 'Requirements',
  architecture: 'System Architecture',
  monorepo: 'Monorepo Structure',
  'domain-model': 'Domain Model',
  'tech-stack': 'Tech Stack',
  'dag-execution': 'DAG Execution',
  'workflow-engine': 'Workflow Engine',
  'event-bus': 'Event Bus',
  workers: 'Worker System',
  scheduler: 'Scheduler',
  'state-machine': 'State Machine',
  api: 'API Reference',
  pipelines: 'Pipelines',
  executions: 'Executions',
  websocket: 'WebSocket',
  'failure-recovery': 'Failure Recovery',
  security: 'Security',
  'ai-analyzer': 'AI Analyzer',
  observability: 'Observability',
  configuration: 'Configuration',
  docker: 'Docker',
  development: 'Development',
  testing: 'Testing',
  contributing: 'Contributing',
  roadmap: 'Roadmap',
  license: 'License',
};

const Breadcrumbs: React.FC = () => {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) return null;

  const crumbs = parts.map((part, i) => ({
    label: LABELS[part] || part,
    href: '/' + parts.slice(0, i + 1).join('/'),
    isLast: i === parts.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mb-6">
      <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
        <Home size={13} />
      </Link>
      {crumbs.map(crumb => (
        <React.Fragment key={crumb.href}>
          <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
          {crumb.isLast ? (
            <span className="text-slate-600 dark:text-slate-300 font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
