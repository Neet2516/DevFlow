import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'overview',   text: 'Overview',       level: 2 },
  { id: 'endpoints',  text: 'Endpoints',      level: 2 },
  { id: 'auth',       text: 'Authentication', level: 2 },
  { id: 'conventions',text: 'Conventions',    level: 2 },
  { id: 'errors',     text: 'Error responses',level: 2 },
];

const ApiOverviewPage: React.FC = () => (
  <DocPage title="API Reference" description="REST API surface for DevFlow pipeline and execution management." toc={TOC}>

    <h2 id="overview">Overview</h2>
    <p>
      DevFlow exposes a versioned REST API for all control-plane operations. Real-time updates are delivered
      via WebSocket — see the <a href="/docs/api/websocket">WebSocket API</a> docs.
    </p>
    <ul>
      <li><strong>Base path:</strong> <code>/api/v1</code></li>
      <li><strong>Auth:</strong> Bearer JWT in <code>Authorization</code> header</li>
      <li><strong>Content-Type:</strong> <code>application/json</code></li>
      <li><strong>Pagination:</strong> cursor-based (<code>?cursor=&lt;id&gt;&amp;limit=&lt;n&gt;</code>)</li>
      <li><strong>Errors:</strong> RFC 7807-style problem responses</li>
    </ul>

    <h2 id="endpoints">Endpoint summary</h2>
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr><th>Endpoint</th><th>Method</th><th>Service</th><th>Description</th></tr>
        </thead>
        <tbody>
          {[
            ['/api/v1/pipelines',                   'POST / GET', 'Pipeline :3001',  'Create and list pipelines'],
            ['/api/v1/pipelines/validate',          'POST',       'Pipeline :3001',  'Dry-Run DAG validation sandbox'],
            ['/api/v1/templates',                   'GET',        'Pipeline :3001',  'Fetch enterprise pipeline templates'],
            ['/api/v1/pipelines/from-template',     'POST',       'Pipeline :3001',  'Instantiate pipeline from template'],
            ['/api/v1/pipelines/:id/executions',    'POST',       'Execution :3002', 'Trigger pipeline execution'],
            ['/api/v1/executions/:id',              'GET',        'Execution :3002', 'Get execution status and job states'],
            ['/api/v1/executions/:id/cancel',       'POST',       'Execution :3002', 'Cancel running execution'],
            ['/api/v1/executions/:id/restart',      'POST',       'Execution :3002', 'Restart execution from scratch'],
            ['/api/v1/executions/:id/logs/export',  'GET',        'Execution :3002', 'Export logs as TXT or JSON'],
            ['/api/v1/analytics/performance',        'GET',        'Execution :3002', 'Platform performance analytics'],
            ['/api/v1/executions/:id/analysis',     'GET',        'AI Analyzer :3004','AI failure root cause analysis'],
            ['/webhooks/github',                    'POST',       'GitHub Adapter :3006','GitHub push/PR webhook trigger'],
            ['/api/v1/audit',                       'GET',        'Audit :3007',     'Fetch compliance audit trail'],
          ].map(([ep, method, svc, desc]) => (
            <tr key={ep}>
              <td><code className="text-xs">{ep}</code></td>
              <td>
                {method.split(' / ').map(m => (
                  <span key={m} className={`method-${m.toLowerCase()} mr-1`}>{m}</span>
                ))}
              </td>
              <td className="text-xs text-slate-400">{svc}</td>
              <td>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <h2 id="auth">Authentication</h2>
    <p>Include a Bearer JWT in the <code>Authorization</code> header on every request:</p>
    <CodeBlock language="bash" code={`curl -H "Authorization: Bearer <token>" \\
  http://localhost:3000/api/v1/pipelines`} />
    <p>
      Tokens are short-lived. Clients should implement a refresh-token flow. See the{' '}
      <a href="/docs/security">Security</a> page for full auth details.
    </p>

    <h2 id="conventions">Conventions</h2>
    <ul>
      <li><strong>Cursor pagination</strong> — use <code>?cursor=&lt;lastId&gt;&amp;limit=20</code>; offset pagination is intentionally not supported as it breaks under concurrent writes.</li>
      <li><strong>202 Accepted for execution triggers</strong> — execution is async; clients must poll or subscribe via WebSocket for terminal status.</li>
      <li><strong>Idempotency header</strong> — include <code>Idempotency-Key: &lt;uuid&gt;</code> on POST requests to deduplicate within 24 hours.</li>
      <li><strong>Versioning</strong> — breaking changes ship under <code>/api/v2</code>; v1 is supported for at least one deprecation cycle.</li>
    </ul>

    <h2 id="errors">Error responses</h2>
    <CodeBlock language="json" filename="error-response.json" code={`{
  "type": "https://devflow.dev/errors/invalid-dag",
  "title": "Invalid Pipeline DAG",
  "status": 422,
  "detail": "Cycle detected: job_a → job_b → job_c → job_a",
  "errors": [
    { "jobId": "job_a", "message": "Part of a dependency cycle" }
  ]
}`} />

    <table>
      <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
      <tbody>
        {[
          ['400', 'Malformed JSON or missing required fields'],
          ['401', 'Missing or invalid Authorization token'],
          ['403', 'Token valid but lacks required permission'],
          ['404', 'Pipeline, Execution, or Job not found'],
          ['422', 'Valid JSON but invalid DAG (cycle, missing reference)'],
          ['429', 'Rate limit exceeded — check Retry-After header'],
          ['500', 'Unexpected server error'],
        ].map(([s, m]) => (
          <tr key={s}><td><code>{s}</code></td><td>{m}</td></tr>
        ))}
      </tbody>
    </table>

  </DocPage>
);

export default ApiOverviewPage;
