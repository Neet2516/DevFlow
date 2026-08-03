import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import http from 'http';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = Number(process.env.GITHUB_ADAPTER_PORT || 3006);
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

app.use(cors());
app.use(express.json());

// Verify GitHub HMAC signature if secret configured
function verifySignature(req: express.Request): boolean {
  if (!WEBHOOK_SECRET) return true; // dev mode bypass
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'github-adapter' });
});

app.post('/webhooks/github', async (req, res) => {
  try {
    if (!verifySignature(req)) {
      res.status(401).json({ error: 'Invalid HMAC signature' });
      return;
    }

    const eventType = req.headers['x-github-event'] as string || 'push';
    const body = req.body;

    let branch = 'main';
    let commitSha = 'HEAD';
    let author = 'github-user';
    let repoName = 'DevFlow';

    if (eventType === 'push') {
      branch = body.ref ? body.ref.replace('refs/heads/', '') : 'main';
      commitSha = body.after || body.head_commit?.id || 'HEAD';
      author = body.pusher?.name || body.head_commit?.author?.name || 'pusher';
      repoName = body.repository?.name || 'DevFlow';
    } else if (eventType === 'pull_request') {
      branch = body.pull_request?.head?.ref || 'feature';
      commitSha = body.pull_request?.head?.sha || 'HEAD';
      author = body.pull_request?.user?.login || 'pr-author';
      repoName = body.repository?.name || 'DevFlow';
    }

    console.log(`[GITHUB ADAPTER] Received ${eventType} event for ${repoName} (${branch}@${commitSha.slice(0, 7)}) by ${author}`);

    // Variables injected into pipeline execution
    const variables = {
      GIT_COMMIT_SHA: commitSha,
      GIT_BRANCH: branch,
      GIT_AUTHOR: author,
      GIT_REPO: repoName,
      EVENT_TYPE: eventType,
    };

    // Find first pipeline or target pipelineId from query
    const targetPipelineId = (req.query.pipelineId as string) || (process.env.DEFAULT_PIPELINE_ID);

    let pipelineId = targetPipelineId;

    if (!pipelineId) {
      // Query API Gateway for latest pipeline
      const listRes = await fetch(`${API_GATEWAY_URL}/api/v1/pipelines`);
      if (listRes.ok) {
        const pipelines = await listRes.json();
        if (pipelines.length > 0) pipelineId = pipelines[0].id;
      }
    }

    if (!pipelineId) {
      res.status(404).json({ error: 'No pipeline found to trigger.' });
      return;
    }

    // Trigger execution via API Gateway
    const triggerRes = await fetch(`${API_GATEWAY_URL}/api/v1/pipelines/${pipelineId}/executions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables }),
    });

    const triggerData = await triggerRes.json();

    res.status(202).json({
      message: `GitHub ${eventType} trigger accepted`,
      executionId: triggerData.executionId,
      pipelineId,
      variables,
    });
  } catch (err: any) {
    console.error('GitHub webhook adapter error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`GitHub Webhook Adapter listening on port ${PORT}`);
});
