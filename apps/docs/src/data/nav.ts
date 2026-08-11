// ─────────────────────────────────────────────
// Navigation data — single source of truth
// ─────────────────────────────────────────────

export interface NavItem {
  id: string;
  title: string;
  href: string;
  badge?: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export const navItems: NavSection[] = [
  {
    section: 'Getting Started',
    items: [
      { id: 'introduction',   title: 'Introduction',         href: '/docs/introduction' },
      { id: 'quickstart',     title: 'Quick Start',          href: '/docs/quickstart' },
      { id: 'installation',   title: 'Installation',         href: '/docs/installation' },
      { id: 'requirements',   title: 'Requirements',         href: '/docs/requirements' },
    ],
  },
  {
    section: 'Architecture',
    items: [
      { id: 'overview',       title: 'System Overview',      href: '/docs/architecture' },
      { id: 'monorepo',       title: 'Monorepo Structure',   href: '/docs/monorepo' },
      { id: 'domain-model',   title: 'Domain Model',         href: '/docs/domain-model' },
      { id: 'tech-stack',     title: 'Tech Stack',           href: '/docs/tech-stack' },
    ],
  },
  {
    section: 'Core Concepts',
    items: [
      { id: 'dag-execution',  title: 'DAG Execution',        href: '/docs/dag-execution' },
      { id: 'workflow-engine',title: 'Workflow Engine',       href: '/docs/workflow-engine' },
      { id: 'event-bus',      title: 'Event Bus',            href: '/docs/event-bus' },
      { id: 'worker-system',  title: 'Worker System',        href: '/docs/workers' },
      { id: 'scheduler',      title: 'Scheduler',            href: '/docs/scheduler' },
      { id: 'state-machine',  title: 'State Machine',        href: '/docs/state-machine' },
    ],
  },
  {
    section: 'API Reference',
    items: [
      { id: 'api-overview',   title: 'API Overview',         href: '/docs/api' },
      { id: 'pipelines-api',  title: 'Pipelines',            href: '/docs/api/pipelines' },
      { id: 'executions-api', title: 'Executions',           href: '/docs/api/executions' },
      { id: 'websocket-api',  title: 'WebSocket',            href: '/docs/api/websocket' },
    ],
  },
  {
    section: 'Features',
    items: [
      { id: 'failure-recovery',title:'Failure Recovery',     href: '/docs/failure-recovery' },
      { id: 'security',       title: 'Security & Secrets',   href: '/docs/security' },
      { id: 'ai-analyzer',    title: 'AI Failure Analyzer',  href: '/docs/ai-analyzer', badge: 'New' },
      { id: 'observability',  title: 'Observability',        href: '/docs/observability' },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { id: 'env-config',     title: 'Environment Variables',href: '/docs/configuration' },
      { id: 'docker',         title: 'Docker & Compose',     href: '/docs/docker' },
    ],
  },
  {
    section: 'Development',
    items: [
      { id: 'dev-workflow',   title: 'Development Workflow', href: '/docs/development' },
      { id: 'testing',        title: 'Testing Strategy',     href: '/docs/testing' },
      { id: 'contributing',   title: 'Contributing',         href: '/docs/contributing' },
    ],
  },
  {
    section: 'Project',
    items: [
      { id: 'roadmap',        title: 'Roadmap',              href: '/docs/roadmap' },
      { id: 'license',        title: 'License',              href: '/docs/license' },
    ],
  },
];

export const allNavItems: NavItem[] = navItems.flatMap(s => s.items);
