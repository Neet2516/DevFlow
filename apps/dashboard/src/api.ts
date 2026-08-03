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
