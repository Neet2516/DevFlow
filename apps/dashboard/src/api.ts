const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchPipelines(): Promise<any[]> {
  const res = await fetch(`${BASE}/api/v1/pipelines`);
  if (!res.ok) throw new Error('Failed to fetch pipelines');
  return res.json();
}

export async function fetchPipeline(id: string): Promise<any> {
  const res = await fetch(`${BASE}/api/v1/pipelines/${id}`);
  if (!res.ok) throw new Error('Failed to fetch pipeline');
  return res.json();
}

export async function fetchExecution(id: string): Promise<any> {
  const res = await fetch(`${BASE}/api/v1/executions/${id}`);
  if (!res.ok) throw new Error('Failed to fetch execution');
  return res.json();
}

export async function triggerExecution(pipelineId: string): Promise<{ executionId: string }> {
  const res = await fetch(`${BASE}/api/v1/pipelines/${pipelineId}/executions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Failed to trigger execution');
  return res.json();
}

export async function retryJob(executionId: string, jobId: string): Promise<any> {
  const res = await fetch(`${BASE}/api/v1/executions/${executionId}/jobs/${jobId}/retry`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to retry job');
  return res.json();
}

export async function skipJob(executionId: string, jobId: string): Promise<any> {
  const res = await fetch(`${BASE}/api/v1/executions/${executionId}/jobs/${jobId}/skip`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to skip job');
  return res.json();
}

export async function restartExecution(executionId: string): Promise<any> {
  const res = await fetch(`${BASE}/api/v1/executions/${executionId}/restart`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to restart execution');
  return res.json();
}

export async function cancelExecution(executionId: string): Promise<any> {
  const res = await fetch(`${BASE}/api/v1/executions/${executionId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to cancel execution');
  return res.json();
}

export async function fetchAiAnalysis(executionId: string): Promise<any> {
  const res = await fetch(`${BASE}/api/v1/executions/${executionId}/analysis`);
  if (!res.ok) return null;
  return res.json();
}

export async function createPipeline(name: string, dag: any): Promise<{ id: string; name: string; versionId: string }> {
  const res = await fetch(`${BASE}/api/v1/pipelines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, dag }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.errors?.join(', ') || 'Failed to create pipeline');
  }
  return res.json();
}

export async function fetchTemplates(): Promise<any[]> {
  const res = await fetch(`${BASE}/api/v1/templates`);
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function createPipelineFromTemplate(templateId: string, name?: string): Promise<any> {
  const res = await fetch(`${BASE}/api/v1/pipelines/from-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, name }),
  });
  if (!res.ok) throw new Error('Failed to create pipeline from template');
  return res.json();
}

export async function deletePipeline(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/v1/pipelines/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete pipeline');
  }
}
