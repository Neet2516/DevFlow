const Redis = require('ioredis');
const { WorkerRuntime } = require('./apps/worker/dist/index.js');
const { QUEUES } = require('./packages/shared/dist/index.js');

// Load environment configuration
require('dotenv').config();

const workerId = process.argv[2] || `test-worker-${Math.random().toString(36).substring(2, 9)}`;
console.log(`Starting worker: ${workerId}`);

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const runtime = new WorkerRuntime(QUEUES.BUILD, redisConnection, workerId);

// Handle graceful shutdown signals
process.on('SIGTERM', async () => {
  console.log(`Shutting down worker: ${workerId}`);
  await runtime.close();
  await redisConnection.quit();
  process.exit(0);
});
