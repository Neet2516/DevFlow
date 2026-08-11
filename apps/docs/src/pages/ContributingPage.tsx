import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';

const TOC = [
  { id: 'how-to',  text: 'How to contribute', level: 2 },
  { id: 'setup',   text: 'Dev setup',          level: 2 },
  { id: 'prs',     text: 'Pull request guide', level: 2 },
  { id: 'commits', text: 'Commit conventions', level: 2 },
];

const ContributingPage: React.FC = () => (
  <DocPage title="Contributing" description="Guidelines for contributing code, documentation, and bug reports to DevFlow." toc={TOC}>

    <p>
      Thank you for your interest in contributing to DevFlow! We welcome contributions from developers
      of all skill levels — bug fixes, new worker runners, DAG engine optimizations, or documentation improvements.
    </p>

    <h2 id="how-to">How to contribute</h2>
    <ul>
      <li><strong>Report bugs</strong> — open a GitHub issue using the Bug Report template.</li>
      <li><strong>Suggest features</strong> — propose ideas using the Feature Request template.</li>
      <li><strong>Submit code</strong> — pick an open issue labeled <code>good first issue</code> or <code>help wanted</code> and open a PR.</li>
      <li><strong>Improve docs</strong> — enhance existing guides, document API endpoints, or add code examples.</li>
    </ul>

    <h2 id="setup">Development setup</h2>
    <CodeBlock terminal language="bash" code={`# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/DevFlow.git
cd DevFlow

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env

# 4. Start infrastructure
docker-compose up -d

# 5. Build all workspaces
npm run build`} />

    <h2 id="prs">Pull request guide</h2>
    <ol>
      <li>Create a feature branch from <code>main</code>.</li>
      <li>Make your changes with focused, atomic commits.</li>
      <li>Ensure <code>npm run build</code> succeeds without TypeScript errors.</li>
      <li>Ensure <code>npm test</code> passes completely.</li>
      <li>Update <code>.env.example</code> if new environment variables were introduced.</li>
      <li>Open a PR against <code>main</code> with the PR checklist completed.</li>
      <li>Link to relevant issue numbers (e.g., <code>Fixes #123</code>).</li>
    </ol>

    <h2 id="commits">Commit message conventions</h2>
    <p>DevFlow uses <a href="https://www.conventionalcommits.org" target="_blank" rel="noopener noreferrer">Conventional Commits</a>:</p>
    <CodeBlock language="bash" code={`feat: add Slack notification channel
fix: resolve cycle detection deadlock in graph engine
docs: update API gateway endpoints table
test: add unit tests for token masking engine
refactor: simplify worker heartbeat loop
perf: cache DAG structure per PipelineVersion`} />

    <p>Community resources:</p>
    <ul>
      <li><a href="https://github.com/Neet2516/DevFlow/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a> — bug reports and feature discussions</li>
      <li><a href="/docs/architecture">Architecture docs</a> — understand the system before making structural changes</li>
      <li><code>docs/31-coding-guidelines.md</code> — code style and conventions</li>
    </ul>

  </DocPage>
);

export default ContributingPage;
