import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'create-pipeline',   text: 'Create pipeline',     level: 2 },
  { id: 'list-pipelines',    text: 'List pipelines',      level: 2 },
  { id: 'validate-pipeline', text: 'Validate (Dry-Run)',  level: 2 },
  { id: 'templates',         text: 'Templates',           level: 2 },
  { id: 'from-template',     text: 'From template',       level: 2 },
];

const PipelinesApiPage: React.FC = () => (
  <DocPage title="Pipelines API" description="Endpoints for creating, listing, and validating pipelines." toc={TOC}>

    <h2 id="create-pipeline">Create pipeline</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-post">POST</span>
      <code className="text-sm">/api/v1/pipelines</code>
    </div>
    <p>Creates a new pipeline and its initial version. The DAG is validated synchronously — cycles or dangling references return <code>422</code>.</p>

    <CodeBlock language="json" filename="Request body" code={`{
  "name": "backend-deploy",
  "dag": {
    "jobs": [
      {
        "id": "build",
        "name": "Build",
        "type": "build",
        "command": "npm run build",
        "dependsOn": []
      },
      {
        "id": "test",
        "name": "Test",
        "type": "test",
        "command": "npm test",
        "dependsOn": ["build"],
        "retryPolicy": { "maxAttempts": 3, "backoffMs": 1000 }
      },
      {
        "id": "deploy",
        "name": "Deploy to Production",
        "type": "deploy",
        "command": "kubectl rollout ...",
        "dependsOn": ["test"]
      }
    ]
  }
}`} />

    <CodeBlock language="json" filename="Response 201" code={`{
  "id": "pl_abc123",
  "name": "backend-deploy",
  "versionId": "plv_xyz456",
  "createdAt": "2026-08-11T06:00:00.000Z"
}`} />

    <h2 id="list-pipelines">List pipelines</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-get">GET</span>
      <code className="text-sm">/api/v1/pipelines?cursor=pl_100&amp;limit=20</code>
    </div>
    <CodeBlock language="json" filename="Response 200" code={`{
  "data": [
    { "id": "pl_abc123", "name": "backend-deploy", "versionId": "plv_xyz456" }
  ],
  "nextCursor": "pl_abc000",
  "hasMore": true
}`} />

    <h2 id="validate-pipeline">Validate — Dry-Run Sandbox</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-post">POST</span>
      <code className="text-sm">/api/v1/pipelines/validate</code>
    </div>
    <p>Validates a DAG definition without persisting it — useful for CI pre-checks and authoring tooling.</p>
    <CodeBlock language="json" filename="Response 200 — valid" code={`{ "valid": true, "nodeCount": 3, "edgeCount": 2 }`} />
    <CodeBlock language="json" filename="Response 422 — cycle detected" code={`{
  "valid": false,
  "errors": [
    { "type": "cycle", "message": "Cycle: build → test → build", "nodes": ["build","test"] }
  ]
}`} />

    <h2 id="templates">Pipeline templates</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-get">GET</span>
      <code className="text-sm">/api/v1/templates</code>
    </div>
    <p>Returns pre-built DAG templates for common project types:</p>
    <CodeBlock language="json" filename="Response 200" code={`{
  "templates": [
    { "id": "nodejs-ci", "name": "Node.js CI Pipeline", "language": "nodejs" },
    { "id": "python-ci", "name": "Python CI Pipeline",  "language": "python" },
    { "id": "go-ci",     "name": "Go CI Pipeline",      "language": "go" },
    { "id": "java-spring","name":"Java Spring Boot CI",  "language": "java" }
  ]
}`} />

    <h2 id="from-template">Instantiate from template</h2>
    <div className="flex items-center gap-2 mb-3">
      <span className="method-post">POST</span>
      <code className="text-sm">/api/v1/pipelines/from-template</code>
    </div>
    <CodeBlock language="json" filename="Request body" code={`{
  "templateId": "nodejs-ci",
  "name": "my-app-pipeline",
  "overrides": {
    "build": { "command": "npm ci && npm run build:prod" }
  }
}`} />

    <Callout type="tip">
      Templates are defined in <code>packages/templates</code> and can be customized with job-level overrides at instantiation time.
    </Callout>

  </DocPage>
);

export default PipelinesApiPage;
