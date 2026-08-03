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
const PORT = Number(process.env.AUDIT_PORT || 3007);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

app.use(cors());
app.use(express.json());

export interface AuditRecord {
  auditId: string;
  eventType: string;
  pipelineId: string;
  executionId: string;
  jobId?: string;
  actor: string;
  sequence: number;
  timestamp: string;
  details: Record<string, unknown>;
}

const auditTrail: AuditRecord[] = [];

function recordAudit(event: DevFlowEvent): void {
  if (event.type === 'log.line') return; // Exclude high-volume raw stdout lines from audit trail

  const record: AuditRecord = {
    auditId: `aud-${Math.random().toString(36).slice(2, 9)}`,
    eventType: event.type,
    pipelineId: event.pipelineId,
    executionId: event.executionId,
    jobId: (event as any).jobId,
    actor: (event as any).workerId || 'system-orchestrator',
    sequence: event.sequence,
    timestamp: event.timestamp,
    details: { ...(event as any) },
  };

  auditTrail.push(record);
  if (auditTrail.length > 1000) auditTrail.shift(); // Cap buffer size

  console.log(`[AUDIT SERVICE] Recorded ${event.type} for execution ${event.executionId} (seq: ${event.sequence})`);
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'audit' });
});

app.get('/api/v1/audit', (req, res) => {
  const { executionId, eventType } = req.query;
  let records = auditTrail;

  if (executionId) records = records.filter(r => r.executionId === executionId);
  if (eventType) records = records.filter(r => r.eventType === eventType);

  res.json({
    total: records.length,
    auditTrail: records.slice(-100),
  });
});

async function startConsumer() {
  const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
  const consumerGroup = 'audit-group';
  const consumerName = `audit-svc-${Math.random().toString(36).slice(2, 7)}`;

  try {
    await redis.xgroup('CREATE', STREAMS.JOB_EVENTS, consumerGroup, '$', 'MKSTREAM');
  } catch (err: any) {
    if (!err.message.includes('BUSYGROUP')) throw err;
  }

  console.log(`Audit Service consuming from Redis Stream: ${STREAMS.JOB_EVENTS}`);

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
            recordAudit(payload);
          }

          await redis.xack(STREAMS.JOB_EVENTS, consumerGroup, messageId);
        }
      }
    } catch (err: any) {
      console.error('Audit consumer error:', err.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

app.listen(PORT, () => {
  console.log(`Audit Service listening on port ${PORT}`);
  startConsumer().catch(console.error);
});
