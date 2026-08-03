import Redis from 'ioredis';
import { WorkerRuntime } from '@devflow/worker';
import { QUEUES } from '@devflow/shared';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const workerId = `build-worker-${Math.random().toString(36).substring(2, 9)}`;

console.log(`Starting Build Worker: ${workerId}`);

const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Critical requirement for BullMQ
});

const runtime = new WorkerRuntime(QUEUES.BUILD, redisConnection, workerId);

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down build worker...');
  await runtime.close();
  await redisConnection.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
