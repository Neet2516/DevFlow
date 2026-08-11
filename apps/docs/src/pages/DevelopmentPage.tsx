import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'dev-commands',  text: 'Dev commands',    level: 2 },
  { id: 'single-service',text: 'Single service',  level: 2 },
  { id: 'testing',       text: 'Running tests',   level: 2 },
  { id: 'db',            text: 'Database tasks',  level: 2 },
  { id: 'pr-workflow',   text: 'PR workflow',     level: 2 },
];

const DevelopmentPage: React.FC = () => (
  <DocPage title="Development Workflow" description="How to run, test, and contribute to DevFlow locally." toc={TOC}>

    <h2 id="dev-commands">Dev commands</h2>
    <p>All dev commands are run from the monorepo root:</p>

    <CodeBlock terminal language="bash" code={`# Full stack — all 14 services + workers (uses concurrently)
npm run dev

# Core stack — API Gateway, Pipeline, Execution, WebSocket, Dashboard, Build Worker
npm run dev:core`} />

    <p>The <code>dev</code> script uses <code>concurrently</code> to launch all services simultaneously with color-coded output per service.</p>

    <h2 id="single-service">Running a single service</h2>
    <CodeBlock terminal language="bash" code={`# Run a specific workspace
npm run dev -w @devflow/api
npm run dev -w @devflow/pipeline
npm run dev -w @devflow/dashboard
npm run dev -w @devflow/graph-engine`} />

    <h2 id="testing">Running tests</h2>
    <CodeBlock terminal language="bash" code={`# Full monorepo test suite
npm test

# Package-specific unit tests
npm test -w @devflow/graph-engine
npm test -w @devflow/scheduler

# Integration & E2E suite (requires running infrastructure)
npm run test -w @devflow/tests
# Expected result: 35 / 35 Tests Passed ✓`} />

    <Callout type="tip">
      The integration suite validates DAG cycle detection, reactive state transitions, AI log classification,
      webhook payload parsing, secret redaction, DAG diffing, and cancellation logic.
    </Callout>

    <h2 id="db">Database tasks</h2>
    <CodeBlock terminal language="bash" code={`# Regenerate Prisma client after schema changes
npm run db:generate

# Create and apply a new migration
npm run db:migrate

# Open Prisma Studio (visual DB browser on :5555)
npm run db:studio`} />

    <h2 id="pr-workflow">PR workflow</h2>
    <ol>
      <li>Create a feature branch:
        <CodeBlock terminal language="bash" code={`git checkout -b feat/your-feature-name`} />
      </li>
      <li>Use Conventional Commits:
        <CodeBlock terminal language="bash" code={`git commit -m "feat: add Slack notification channel"
git commit -m "fix: resolve cycle detection deadlock in graph engine"
git commit -m "test: add unit tests for token masking engine"`} />
      </li>
      <li>Verify locally before pushing:
        <CodeBlock terminal language="bash" code={`npm run build   # must succeed — no TypeScript errors
npm test        # all tests must pass`} />
      </li>
      <li>Open a PR against the <code>main</code> branch. Complete the PR checklist in <code>.github/PULL_REQUEST_TEMPLATE.md</code>.</li>
    </ol>

  </DocPage>
);

export default DevelopmentPage;
