import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'env-vars',   text: 'Environment variables', level: 2 },
  { id: 'services',   text: 'Service ports',          level: 2 },
  { id: 'optional',   text: 'Optional config',        level: 2 },
];

const ConfigurationPage: React.FC = () => (
  <DocPage title="Environment Variables" description="All configuration options for the DevFlow platform." toc={TOC}>

    <Callout type="note">
      Copy <code>.env.example</code> to <code>.env</code> and adjust values. The defaults work
      for local Docker Compose development without changes.
    </Callout>

    <h2 id="env-vars">Required environment variables</h2>
    <CodeBlock filename=".env" language="env" code={`# ── Database ───────────────────────────────────────────
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5433/devflow?schema=public"
POSTGRES_USER=devflow
POSTGRES_PASSWORD=devflowpassword
POSTGRES_DB=devflow

# ── Authentication ────────────────────────────────────
JWT_SECRET=supersecretjwtkey_changeme_in_production

# ── Redis ─────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Core Service URLs ─────────────────────────────────
API_URL=http://localhost:3000
WS_URL=ws://localhost:3003

# ── Dashboard (Vite env — must be prefixed VITE_) ─────
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3003`} />

    <table>
      <thead><tr><th>Variable</th><th>Default</th><th>Description</th></tr></thead>
      <tbody>
        {[
          ['DATABASE_URL',    'postgresql://postgres:…@localhost:5433/devflow', 'PostgreSQL connection string (Prisma)'],
          ['JWT_SECRET',      '—',    'Secret key for JWT signing. Change in production.'],
          ['REDIS_URL',       'redis://localhost:6379', 'Redis connection URL for queues and streams'],
          ['API_URL',         'http://localhost:3000',  'API Gateway base URL'],
          ['WS_URL',          'ws://localhost:3003',    'WebSocket Gateway URL'],
          ['VITE_API_URL',    'http://localhost:3000',  'Dashboard → API URL (Vite env var)'],
          ['VITE_WS_URL',     'ws://localhost:3003',    'Dashboard → WebSocket URL (Vite env var)'],
        ].map(([v, d, desc]) => (
          <tr key={v}><td><code>{v}</code></td><td><code className="text-xs">{d}</code></td><td>{desc}</td></tr>
        ))}
      </tbody>
    </table>

    <h2 id="services">Microservice ports (override if needed)</h2>
    <CodeBlock filename=".env" language="env" code={`PIPELINE_SERVICE_URL=http://localhost:3001
EXECUTION_SERVICE_URL=http://localhost:3002
WS_SERVICE_URL=http://localhost:3003
AI_ANALYZER_SERVICE_URL=http://localhost:3004
NOTIF_SERVICE_URL=http://localhost:3005
GITHUB_ADAPTER_URL=http://localhost:3006
AUDIT_SERVICE_URL=http://localhost:3007

# Listening port overrides
AI_ANALYZER_PORT=3004
AUDIT_PORT=3007
GITHUB_ADAPTER_PORT=3006
NOTIFICATION_PORT=3005
WS_PORT=3003`} />

    <h2 id="optional">Optional configuration</h2>
    <CodeBlock filename=".env" language="env" code={`# GitHub Webhook (GitHub Adapter service)
GITHUB_WEBHOOK_SECRET=your-hmac-secret-here
DEFAULT_PIPELINE_ID=pl_abc123   # pipeline to trigger on push

# Slack / Discord notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000/B00000/XXXX

# Monitoring
GRAFANA_PASSWORD=devflow        # Grafana admin password`} />

  </DocPage>
);

export default ConfigurationPage;
