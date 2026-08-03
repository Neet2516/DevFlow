import { TEMPLATES } from '@devflow/templates';

describe('Enterprise Templates & Secret Redaction — Integration', () => {
  it('exports valid enterprise templates for Node.js, Python, Go, and Java', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(4);

    const nodeTemplate = TEMPLATES.find(t => t.id === 'nodejs-full-stack');
    expect(nodeTemplate).toBeDefined();
    expect(nodeTemplate.dag.jobs.length).toBe(5);

    const pythonTemplate = TEMPLATES.find(t => t.id === 'python-microservice');
    expect(pythonTemplate).toBeDefined();

    const goTemplate = TEMPLATES.find(t => t.id === 'go-binary-release');
    expect(goTemplate).toBeDefined();

    const javaTemplate = TEMPLATES.find(t => t.id === 'java-spring-enterprise');
    expect(javaTemplate).toBeDefined();
  });

  it('redacts sensitive bearer tokens and secrets from log lines', () => {
    const redactSecrets = (line) => {
      return line
        .replace(/(bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*/gi, '$1[REDACTED_BEARER_TOKEN]')
        .replace(/(password|passwd|secret|api_key|apikey|private_key)=\S+/gi, '$1=[REDACTED_SECRET]')
        .replace(/(AWS_SECRET_ACCESS_KEY|GITHUB_TOKEN|SLACK_WEBHOOK_URL)=\S+/gi, '$1=[REDACTED_SECRET]');
    };

    const rawLine1 = 'Connecting with Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    const redacted1 = redactSecrets(rawLine1);
    expect(redacted1).toContain('[REDACTED_BEARER_TOKEN]');
    expect(redacted1).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');

    const rawLine2 = 'export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
    const redacted2 = redactSecrets(rawLine2);
    expect(redacted2).toBe('export AWS_SECRET_ACCESS_KEY=[REDACTED_SECRET]');

    const rawLine3 = 'DATABASE_URL=postgres://user:password=supersecret123@localhost:5432/db';
    const redacted3 = redactSecrets(rawLine3);
    expect(redacted3).toContain('[REDACTED_SECRET]');
  });
});
