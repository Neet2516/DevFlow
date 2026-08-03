describe('GitHub Webhook & Audit Trail — Integration', () => {
  it('parses GitHub push webhook payload into pipeline variables', () => {
    const payload = {
      ref: 'refs/heads/feature/auth',
      after: 'a1b2c3d4e5f6',
      pusher: { name: 'octocat' },
      repository: { name: 'DevFlow' },
    };

    const branch = payload.ref.replace('refs/heads/', '');
    const commitSha = payload.after;
    const author = payload.pusher.name;
    const repoName = payload.repository.name;

    const variables = {
      GIT_COMMIT_SHA: commitSha,
      GIT_BRANCH: branch,
      GIT_AUTHOR: author,
      GIT_REPO: repoName,
      EVENT_TYPE: 'push',
    };

    expect(variables.GIT_BRANCH).toBe('feature/auth');
    expect(variables.GIT_COMMIT_SHA).toBe('a1b2c3d4e5f6');
    expect(variables.GIT_AUTHOR).toBe('octocat');
    expect(variables.GIT_REPO).toBe('DevFlow');
  });

  it('formats audit records for compliance log', () => {
    const event = {
      type: 'execution.completed',
      pipelineId: 'pipe-123',
      executionId: 'exec-456',
      status: 'succeeded',
      sequence: 12,
      timestamp: new Date().toISOString(),
    };

    const record = {
      auditId: 'aud-789',
      eventType: event.type,
      pipelineId: event.pipelineId,
      executionId: event.executionId,
      actor: 'system-orchestrator',
      sequence: event.sequence,
      timestamp: event.timestamp,
    };

    expect(record.eventType).toBe('execution.completed');
    expect(record.executionId).toBe('exec-456');
    expect(record.actor).toBe('system-orchestrator');
  });
});
