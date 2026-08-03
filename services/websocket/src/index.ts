import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { STREAMS, DevFlowEvent } from '@devflow/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PORT = Number(process.env.WS_PORT || 3003);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ────────────────────────────────────────────────────────────────
// Room registry: executionId → Set<WebSocket>
// ────────────────────────────────────────────────────────────────
const rooms = new Map<string, Set<WebSocket>>();

function joinRoom(executionId: string, ws: WebSocket) {
  if (!rooms.has(executionId)) rooms.set(executionId, new Set());
  rooms.get(executionId)!.add(ws);
}

function leaveRooms(ws: WebSocket) {
  for (const [id, clients] of rooms) {
    clients.delete(ws);
    if (clients.size === 0) rooms.delete(id);
  }
}

function broadcast(executionId: string, payload: DevFlowEvent) {
  const clients = rooms.get(executionId);
  if (!clients || clients.size === 0) return;
  const msg = JSON.stringify(payload);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

// ────────────────────────────────────────────────────────────────
// HTTP + WebSocket Server
// ────────────────────────────────────────────────────────────────
const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', service: 'websocket-gateway' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log(`WS client connected. Total: ${wss.clients.size}`);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'subscribe' && msg.executionId) {
        joinRoom(msg.executionId, ws);
        console.log(`Client subscribed to room: ${msg.executionId}`);
        ws.send(JSON.stringify({ type: 'subscribed', executionId: msg.executionId }));
      }

      if (msg.type === 'unsubscribe' && msg.executionId) {
        rooms.get(msg.executionId)?.delete(ws);
        ws.send(JSON.stringify({ type: 'unsubscribed', executionId: msg.executionId }));
      }
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    leaveRooms(ws);
    console.log(`WS client disconnected. Total: ${wss.clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('WS client error:', err.message);
    leaveRooms(ws);
  });
});

// ────────────────────────────────────────────────────────────────
// Redis Streams consumer — fans out events to room subscribers
// ────────────────────────────────────────────────────────────────
async function startEventConsumer() {
  const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
  const consumerGroup = 'ws-gateway-group';
  const consumerName = `ws-gateway-${Math.random().toString(36).slice(2, 9)}`;

  try {
    await redis.xgroup('CREATE', STREAMS.JOB_EVENTS, consumerGroup, '$', 'MKSTREAM');
  } catch (err: any) {
    if (!err.message.includes('BUSYGROUP')) throw err;
  }

  console.log(`WS Gateway consuming from stream: ${STREAMS.JOB_EVENTS} (group: ${consumerGroup})`);

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

          if (payload && payload.executionId) {
            broadcast(payload.executionId, payload);
          }

          await redis.xack(STREAMS.JOB_EVENTS, consumerGroup, messageId);
        }
      }
    } catch (err: any) {
      console.error('WS consumer error:', err.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

server.listen(PORT, () => {
  console.log(`WebSocket Gateway listening on port ${PORT}`);
  startEventConsumer().catch(console.error);
});
