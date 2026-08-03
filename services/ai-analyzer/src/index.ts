import express from 'express';
import cors from 'cors';
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { STREAMS, DevFlowEvent } from '@devflow/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = Number(process.env.AI_ANALYZER_PORT || 3004);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

app.use(cors());
app.use(express.json());

// In-memory analysis store (executionId -> FailureAnalysis)
export interface FailureAnalysis {
  executionId: string;
  jobId: string;
  errorCategory: 'SyntaxError' | 'DependencyError' | 'TimeoutError' | 'OutOfMemory' | 'NetworkError' | 'ExecutionError';
  rootCause: string;
  confidenceScore: number;
  recommendation: string;
  suggestedAction: 'retry' | 'increase_memory' | 'fix_script' | 'check_network';
  analyzedAt: string;
  relevantLogSnippet?: string;
}

const analysisStore = new Map<string, FailureAnalysis>();
const executionLogs = new Map<string, string[]>(); // jobExecutionId -> lines

function analyzeLogs(jobId: string, error: string, logs: string[]): Omit<FailureAnalysis, 'executionId' | 'jobId' | 'analyzedAt'> {
  const fullText = logs.join('\n') + '\n' + error;

  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(fullText)) {
    return {
      errorCategory: 'NetworkError',
      rootCause: `Network connectivity failure detected while executing job "${jobId}". Target host or endpoint unreachable.`,
      confidenceScore: 0.94,
      recommendation: 'Verify target service endpoint health, DNS resolution, and security group egress rules.',
      suggestedAction: 'check_network',
      relevantLogSnippet: logs.find(l => /ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(l)) || error,
    };
  }

  if (/JavaScript heap out of memory|Killed|OOMKilled|Memory limit/i.test(fullText)) {
    return {
      errorCategory: 'OutOfMemory',
      rootCause: `Subprocess exhausted available heap memory allocation in job "${jobId}".`,
      confidenceScore: 0.98,
      recommendation: 'Increase node memory allocation (--max-old-space-size) or upgrade worker memory capacity.',
      suggestedAction: 'increase_memory',
      relevantLogSnippet: logs.find(l => /heap out of memory|Killed/i.test(l)) || error,
    };
  }

  if (/Cannot find module|MODULE_NOT_FOUND|npm error|Command not found|TS2307/i.test(fullText)) {
    return {
      errorCategory: 'DependencyError',
      rootCause: `Missing required package or executable dependency in environment for job "${jobId}".`,
      confidenceScore: 0.92,
      recommendation: 'Ensure package dependencies are installed before execution or declare them in project package.json.',
      suggestedAction: 'fix_script',
      relevantLogSnippet: logs.find(l => /Cannot find module|MODULE_NOT_FOUND|npm error/i.test(l)) || error,
    };
  }

  if (/SyntaxError|Unexpected token|ParseError/i.test(fullText)) {
    return {
      errorCategory: 'SyntaxError',
      rootCause: `Script compilation or JSON parsing failure in job "${jobId}".`,
      confidenceScore: 0.96,
      recommendation: 'Check script syntax, quotes, and file structure around the reported line number.',
      suggestedAction: 'fix_script',
      relevantLogSnippet: logs.find(l => /SyntaxError|Unexpected token/i.test(l)) || error,
    };
  }

  return {
    errorCategory: 'ExecutionError',
    rootCause: `Subprocess exited with failure code for job "${jobId}": ${error}`,
    confidenceScore: 0.85,
    recommendation: 'Inspect step command output or retry step after resolving script errors.',
    suggestedAction: 'retry',
    relevantLogSnippet: logs.slice(-3).join('\n') || error,
  };
}

// REST APIs
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'ai-analyzer' });
});

app.get('/api/v1/executions/:id/analysis', (req, res) => {
  const { id } = req.params;
  const analysis = analysisStore.get(id);
  if (!analysis) {
    res.status(404).json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'No AI failure analysis recorded for this execution.' });
    return;
  }
  res.json(analysis);
});

async function startConsumer() {
  const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
  const consumerGroup = 'ai-analyzer-group';
  const consumerName = `ai-analyzer-${Math.random().toString(36).slice(2, 7)}`;

  try {
    await redis.xgroup('CREATE', STREAMS.JOB_EVENTS, consumerGroup, '$', 'MKSTREAM');
  } catch (err: any) {
    if (!err.message.includes('BUSYGROUP')) throw err;
  }

  console.log(`AI Failure Analyzer consuming from Redis Stream: ${STREAMS.JOB_EVENTS}`);

  while (true) {
    try {
      const streams = (await redis.xreadgroup(
        'GROUP', consumerGroup, consumerName,
        'COUNT', 50,
        'BLOCK', 1000,
        'STREAMS', STREAMS.JOB_EVENTS, '>'
      )) as any;

      if (!streams) continue;

      for (const [, messages] of streams) {
        for (const [messageId, fields] of messages) {
          let payload: DevFlowEvent | null = null;
          for (let i = 0; i < fields.length; i += 2) {
            if (fields[i] === 'payload') {
              try { payload = JSON.parse(fields[i + 1]); } catch { /* ignore */ }
              break;
            }
          }

          if (payload) {
            if (payload.type === 'log.line') {
              const key = payload.jobExecutionId;
              if (!executionLogs.has(key)) executionLogs.set(key, []);
              executionLogs.get(key)!.push(payload.line);
            } else if (payload.type === 'job.failed') {
              const logs = executionLogs.get(payload.jobExecutionId) || [];
              const result = analyzeLogs(payload.jobId, payload.error, logs);

              const analysis: FailureAnalysis = {
                executionId: payload.executionId,
                jobId: payload.jobId,
                ...result,
                analyzedAt: new Date().toISOString(),
              };

              analysisStore.set(payload.executionId, analysis);
              console.log(`[AI ANALYZER] Failure analyzed for execution ${payload.executionId} (${analysis.errorCategory}): ${analysis.rootCause}`);
            }
          }

          await redis.xack(STREAMS.JOB_EVENTS, consumerGroup, messageId);
        }
      }
    } catch (err: any) {
      console.error('AI Analyzer consumer error:', err.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

app.listen(PORT, () => {
  console.log(`AI Failure Analyzer service listening on port ${PORT}`);
  startConsumer().catch(console.error);
});
