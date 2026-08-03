import express from 'express';
import cors from 'cors';
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { prisma } from '@devflow/db';
import { Scheduler } from '@devflow/scheduler';
import { startExecution } from './engine/startExecution.js';
import { startEventBusConsumer } from './consumers/eventBusConsumer.js';
import { startLivenessMonitor } from './engine/livenessMonitor.js';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Dual connection config is standard for Redis Streams & BullMQ blocks
const redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null });

const scheduler = new Scheduler(redisClient);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'execution' });
});

// Trigger pipeline execution
app.post('/api/v1/pipelines/:id/executions', async (req, res) => {
  try {
    const { id } = req.params;
    const executionId = await startExecution(id, scheduler);
    res.status(202).json({ executionId, status: 'pending' });
  } catch (error: any) {
    console.error('Failed to trigger execution:', error);
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message || 'Failed to start execution.',
    });
  }
});

// Get execution status
app.get('/api/v1/executions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const execution = await prisma.execution.findUnique({
      where: { id },
      include: {
        jobExecutions: true,
      },
    });

    if (!execution) {
      res.status(404).json({
        type: 'about:blank',
        title: 'Resource Not Found',
        status: 404,
        detail: `Execution with ID "${id}" was not found.`,
      });
      return;
    }

    res.json(execution);
  } catch (error: any) {
    console.error('Error fetching execution:', error);
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message || 'An unexpected error occurred.',
    });
  }
});

app.listen(port, () => {
  console.log(`Execution service listening on port ${port}`);

  // Bootstrap event polling on the Event Bus Redis Stream
  startEventBusConsumer(redisClient, scheduler);

  // Bootstrap liveness monitor sweep
  startLivenessMonitor(redisClient, scheduler);
});
