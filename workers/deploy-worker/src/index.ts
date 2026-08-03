import Redis from 'ioredis';
import { WorkerRuntime } from '@devflow/worker';
import { QUEUES } from '@devflow/shared';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const workerId = `deploy-worker-${Math.random().toString(36).substring(2, 9)}`;

console.log(`Starting Deploy Worker: ${workerId}`);

const redisConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const runtime = new WorkerRuntime(QUEUES.DEPLOY, redisConnection, workerId);

const shutdown = async () => {
  console.log('Shutting down deploy worker...');
  await runtime.close();
  await redisConnection.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
