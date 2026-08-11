import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'install-deps',  text: 'Install dependencies',   level: 2 },
  { id: 'configure-env', text: 'Configure environment',  level: 2 },
  { id: 'database',      text: 'Database setup',          level: 2 },
  { id: 'build',         text: 'Build packages',          level: 2 },
  { id: 'production',    text: 'Production build',        level: 2 },
  { id: 'workspace-cmd', text: 'Workspace commands',      level: 2 },
];

const InstallationPage: React.FC = () => (
  <DocPage title="Installation" description="Detailed installation and build steps for the DevFlow monorepo." toc={TOC}>

    <h2 id="install-deps">Install dependencies</h2>
    <p>
      DevFlow is an npm workspaces monorepo. Running <code>npm install</code> at the root installs
      dependencies for all packages, services, workers, and the dashboard simultaneously.
    </p>
    <CodeBlock terminal language="bash" code={`npm install`} />

    <Callout type="note">
      DevFlow requires Node.js ≥ v18. If you're using <code>nvm</code>, run{' '}
      <code>nvm use 20</code> first.
    </Callout>

    <h2 id="configure-env">Configure environment</h2>
    <p>Copy the example environment file:</p>
    <CodeBlock terminal language="bash" code={`cp .env.example .env`} />
    <p>Key environment variables:</p>
    <CodeBlock filename=".env" language="env" code={`# Database
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5433/devflow?schema=public"

# Authentication
JWT_SECRET=supersecretjwtkey_changeme_in_production

# Redis
REDIS_URL=redis://localhost:6379

# Services
API_URL=http://localhost:3000
WS_URL=ws://localhost:3003

# Dashboard (Vite)
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3003`} />

    <Callout type="warning">
      Change <code>JWT_SECRET</code> to a strong, random value in production. Never commit <code>.env</code> to version control.
    </Callout>

    <h2 id="database">Database setup</h2>
    <p>Start PostgreSQL and Redis using Docker Compose, then run Prisma migrations:</p>
    <CodeBlock terminal language="bash" code={`# Start infrastructure
docker-compose up -d

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate`} />
    <p>To open Prisma Studio (database browser UI):</p>
    <CodeBlock terminal language="bash" code={`npm run db:studio`} />

    <h2 id="build">Build packages</h2>
    <p>Build all workspaces in the correct dependency order:</p>
    <CodeBlock terminal language="bash" code={`npm run build`} />
    <p>Or build a specific workspace:</p>
    <CodeBlock terminal language="bash" code={`npm run build -w @devflow/graph-engine`} />

    <h2 id="production">Production build</h2>
    <p>Use the production Docker Compose configuration for a fully containerized deployment:</p>
    <CodeBlock terminal language="bash" code={`docker-compose -f docker-compose.prod.yml up -d`} />
    <p>
      The production stack includes Nginx (reverse proxy + TLS), Prometheus, and Grafana in addition
      to all microservices and workers.
    </p>

    <h2 id="workspace-cmd">Workspace commands</h2>
    <p>The root <code>package.json</code> provides convenience scripts for all common operations:</p>
    <table>
      <thead><tr><th>Command</th><th>Description</th></tr></thead>
      <tbody>
        {[
          ['npm run dev', 'Start full dev stack (14 services + workers)'],
          ['npm run dev:core', 'Start core services only (6 processes)'],
          ['npm run build', 'Build all workspaces'],
          ['npm test', 'Run all tests'],
          ['npm run db:generate', 'Regenerate Prisma client from schema'],
          ['npm run db:migrate', 'Apply pending database migrations'],
          ['npm run db:studio', 'Open Prisma Studio (port 5555)'],
        ].map(([cmd, desc]) => (
          <tr key={cmd}><td><code>{cmd}</code></td><td>{desc}</td></tr>
        ))}
      </tbody>
    </table>

  </DocPage>
);

export default InstallationPage;
