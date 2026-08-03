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
const PORT = Number(process.env.NOTIFICATION_PORT || 3005);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

app.use(cors());
app.use(express.json());

// In-memory audit log of sent notifications
export interface SentNotification {
  id: string;
  type: 'slack' | 'discord' | 'webhook';
  eventType: string;
  executionId: string;
  jobId?: string;
  status: 'sent' | 'simulated';
  timestamp: string;
  payload: Record<string, unknown>;
}

const notificationLog: SentNotification[] = [];

async function sendNotification(event: DevFlowEvent): Promise<void> {
  let title = '';
  let color = '#36a64f'; // green
  let fields: any[] = [];

  if (event.type === 'execution.completed') {
    title = `Pipeline Execution ${event.status === 'succeeded' ? 'SUCCESS' : 'FAILED'}: ${event.executionId}`;
    color = event.status === 'succeeded' ? '#22c55e' : '#ef4444';
    fields = [
      { title: 'Pipeline ID', value: event.pipelineId, short: true },
      { title: 'Status', value: event.status.toUpperCase(), short: true },
      { title: 'Timestamp', value: event.timestamp, short: false },
    ];
  } else if (event.type === 'job.failed') {
    title = `⚠️ Job Failed: ${event.jobId} (Execution: ${event.executionId})`;
    color = '#ef4444';
    fields = [
      { title: 'Job ID', value: event.jobId, short: true },
      { title: 'Attempt', value: String(event.attempt), short: true },
      { title: 'Error', value: event.error, short: false },
    ];
  } else {
    return;
  }

  const notification: SentNotification = {
    id: `notif-${Math.random().toString(36).slice(2, 9)}`,
    type: process.env.SLACK_WEBHOOK_URL ? 'slack' : 'webhook',
    eventType: event.type,
    executionId: event.executionId,
    jobId: (event as any).jobId,
    status: 'simulated',
    timestamp: new Date().toISOString(),
    payload: { title, color, fields },
  };

  notificationLog.push(notification);
  console.log(`[NOTIFICATION SERVICE] ${title}`);
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notification' });
});

app.get('/api/v1/notifications', (req, res) => {
  res.json(notificationLog.slice(-50));
});

async function startConsumer() {
  const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
  const consumerGroup = 'notification-group';
  const consumerName = `notification-svc-${Math.random().toString(36).slice(2, 7)}`;

  try {
    await redis.xgroup('CREATE', STREAMS.JOB_EVENTS, consumerGroup, '$', 'MKSTREAM');
  } catch (err: any) {
    if (!err.message.includes('BUSYGROUP')) throw err;
  }

  console.log(`Notification Service consuming from Redis Stream: ${STREAMS.JOB_EVENTS}`);

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
            await sendNotification(payload);
          }

          await redis.xack(STREAMS.JOB_EVENTS, consumerGroup, messageId);
        }
      }
    } catch (err: any) {
      console.error('Notification consumer error:', err.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

app.listen(PORT, () => {
  console.log(`Notification Service listening on port ${PORT}`);
  startConsumer().catch(console.error);
});
