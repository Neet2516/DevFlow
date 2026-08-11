import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';

const TOC = [
  { id: 'secrets',  text: 'Secret management',  level: 2 },
  { id: 'redaction',text: 'Log redaction',      level: 2 },
  { id: 'isolation',text: 'Job isolation',      level: 2 },
  { id: 'auth',     text: 'API authentication', level: 2 },
  { id: 'best-practices', text: 'Best practices', level: 2 },
];

const SecurityPage: React.FC = () => (
  <DocPage title="Security & Secrets" description="Secrets management, log redaction, job isolation, and API authentication." toc={TOC}>

    <h2 id="secrets">Secret management</h2>
    <p>
      Secrets are <strong>referenced by name in pipeline definitions, never stored as plaintext</strong>.
      A pipeline job uses <code>uses: secrets.DEPLOY_KEY</code> — the actual value is injected into the
      worker's environment only for the duration of that specific job.
    </p>
    <CodeBlock language="json" filename="Pipeline job definition" code={`{
  "id": "deploy",
  "type": "deploy",
  "command": "kubectl apply ...",
  "secrets": ["DEPLOY_KEY", "AWS_ROLE_ARN"]
}`} />

    <Callout type="danger" title="Never hardcode secrets">
      Hardcoding secrets in <code>command</code> strings or pipeline definitions is blocked by the API.
      Always use the <code>secrets</code> array to reference named secrets from the secrets store.
    </Callout>

    <p>A leaked or exported pipeline JSON is therefore not itself a credential leak — it contains only secret names, not values.</p>

    <h2 id="redaction">Automated log redaction</h2>
    <p>
      DevFlow's worker runtime includes a <strong>masking engine</strong> that intercepts stdout/stderr lines
      before they are published to the Event Bus or persisted. It redacts:
    </p>
    <ul>
      <li>Bearer tokens (<code>Authorization: Bearer *****</code>)</li>
      <li>AWS access keys (<code>AKIA*****</code>)</li>
      <li>Passwords and API secrets matching known patterns</li>
      <li>Any value matching a currently-injected secret (exact string match)</li>
    </ul>
    <CodeBlock language="bash" code={`# Example: even an accidental "echo $API_KEY" is redacted in logs
echo $API_KEY
# Log output: echo [REDACTED]`} />

    <Callout type="warning">
      Redaction is pattern-based and cannot catch every possible vector (e.g., a secret transformed or
      base64-encoded before printing). It is a defense-in-depth layer, not a substitute for least-privilege scoping.
    </Callout>

    <h2 id="isolation">Job execution isolation</h2>
    <p>Every job runs in an isolated subprocess with:</p>
    <ul>
      <li>No host filesystem access beyond a scoped, wiped-on-completion workspace directory.</li>
      <li>No arbitrary network egress unless explicitly granted per job type.</li>
      <li>Resource limits (CPU and memory) enforced at the container level in production.</li>
      <li>Workspace directory wiped after job completion regardless of success or failure.</li>
    </ul>

    <h2 id="auth">API authentication</h2>
    <p>All REST API endpoints require a Bearer JWT in the <code>Authorization</code> header:</p>
    <CodeBlock language="bash" code={`curl -H "Authorization: Bearer eyJhbGci..." \\
  http://localhost:3000/api/v1/pipelines`} />
    <p>Token characteristics:</p>
    <ul>
      <li>Short-lived access tokens with a separate refresh token flow.</li>
      <li>Signed with the <code>JWT_SECRET</code> from environment configuration.</li>
      <li>Rate limiting: token-bucket per API key; <code>429</code> with <code>Retry-After</code> header on breach.</li>
    </ul>

    <h2 id="best-practices">Best practices</h2>
    <ul>
      <li>Rotate <code>JWT_SECRET</code> periodically and on any suspected compromise.</li>
      <li>Use the <code>test-worker</code> for test jobs — it never has deploy credentials, even if scripts request them.</li>
      <li>Regularly audit the secrets store; remove unused secrets to minimize the blast radius of a potential leak.</li>
      <li>In production, run Redis with authentication (<code>requirepass</code>) and TLS.</li>
    </ul>

  </DocPage>
);

export default SecurityPage;
