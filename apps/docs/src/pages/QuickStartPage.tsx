import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'prerequisites', text: 'Prerequisites',   level: 2 },
  { id: 'clone',         text: '1. Clone & Install', level: 2 },
  { id: 'environment',   text: '2. Environment',  level: 2 },
  { id: 'infrastructure',text: '3. Infrastructure', level: 2 },
  { id: 'build',         text: '4. Build',         level: 2 },
  { id: 'start',         text: '5. Start Dev Stack', level: 2 },
  { id: 'verify',        text: '6. Verify',        level: 2 },
];

const QuickStartPage: React.FC = () => (
  <DocPage title="Quick Start" description="Get DevFlow running locally in under 5 minutes." toc={TOC}>

    <Callout type="note" title="Prerequisites">
      You need Node.js ≥ v18, Docker, and Docker Compose installed before proceeding.
    </Callout>

    <h2 id="prerequisites">Prerequisites</h2>
    <ul>
      <li><strong>Node.js</strong> v18.0.0 or higher (v20 recommended)</li>
      <li><strong>npm</strong> v9+ (npm workspaces enabled)</li>
      <li><strong>Docker &amp; Docker Compose</strong> — for running PostgreSQL and Redis</li>
      <li><strong>Git</strong></li>
    </ul>

    <h2 id="clone">1. Clone &amp; Install</h2>
    <CodeBlock terminal language="bash" code={`git clone https://github.com/Neet2516/DevFlow.git
cd DevFlow
npm install`} />

    <h2 id="environment">2. Environment Configuration</h2>
    <p>Copy the example environment file and configure your local values:</p>
    <CodeBlock terminal language="bash" code={`cp .env.example .env`} />
    <p>The defaults in <code>.env.example</code> work for local Docker Compose development without changes.</p>

    <h2 id="infrastructure">3. Start Infrastructure</h2>
    <p>Start PostgreSQL and Redis via Docker Compose:</p>
    <CodeBlock terminal language="bash" code={`docker-compose up -d`} />
    <p>This starts:</p>
    <ul>
      <li><strong>PostgreSQL</strong> on port <code>5433</code></li>
      <li><strong>Redis</strong> on port <code>6379</code></li>
    </ul>

    <h2 id="build">4. Build All Workspaces</h2>
    <p>Build all monorepo packages, services, and workers:</p>
    <CodeBlock terminal language="bash" code={`npm run build`} />

    <h2 id="start">5. Start the Dev Stack</h2>
    <p>
      You can start either the <strong>full stack</strong> (all 14 services + workers) or the{' '}
      <strong>core stack</strong> (API Gateway, Pipeline, Execution, WebSocket, Dashboard, Build Worker):
    </p>
    <CodeBlock terminal language="bash" code={`# Full stack (all 14 services)
npm run dev

# Core stack only
npm run dev:core`} />

    <p>Once running, open your browser to:</p>
    <ul>
      <li><strong>Dashboard:</strong> <code>http://localhost:5173</code></li>
      <li><strong>API Gateway:</strong> <code>http://localhost:3000</code></li>
    </ul>

    <h2 id="verify">6. Verify with Integration Tests</h2>
    <p>Run the full integration test suite to confirm everything works:</p>
    <CodeBlock terminal language="bash" code={`npm run test -w @devflow/tests
# Result: 35 / 35 Tests Passed ✓`} />

    <Callout type="tip" title="Production deployment">
      For production, use the Docker Compose production stack:{' '}
      <code>docker-compose -f docker-compose.prod.yml up -d</code>
    </Callout>

  </DocPage>
);

export default QuickStartPage;
