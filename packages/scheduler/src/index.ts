import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { QUEUES } from '@devflow/shared';

export class Scheduler {
  private redis: Redis;
  private queues: Map<string, Queue>;

  constructor(redisConnection: Redis) {
    this.redis = redisConnection;
    this.queues = new Map();

    // Map each job type to a BullMQ Queue
    this.queues.set('build', new Queue(QUEUES.BUILD, { connection: this.redis }));
    this.queues.set('test', new Queue(QUEUES.TEST, { connection: this.redis }));
    this.queues.set('deploy', new Queue(QUEUES.DEPLOY, { connection: this.redis }));
    this.queues.set('docker', new Queue(QUEUES.DOCKER, { connection: this.redis }));
    this.queues.set('script', new Queue(QUEUES.SCRIPT, { connection: this.redis }));
  }

  /**
   * Enqueues a job execution to the appropriate BullMQ queue.
   */
  async enqueueJob(
    jobExecutionId: string,
    type: string,
    payload: {
      pipelineId: string;
      executionId: string;
      jobId: string;
      attempt: number;
      cmd?: string;
      variables?: Record<string, string>;
    }
  ): Promise<void> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`No queue configured for job type: ${type}`);
    }

    // Add job to BullMQ queue with execution ID as name
    await queue.add(jobExecutionId, payload, {
      jobId: jobExecutionId, // Ensure unique job ID in queue
      attempts: 1, // BullMQ retries disabled, we manage retries at the engine layer
    });
  }

  /**
   * Acquires a slot in the pipeline's concurrency semaphore.
   * Uses an atomic Lua script to check and increment.
   */
  async acquireSlot(pipelineId: string, maxConcurrency: number): Promise<boolean> {
    const key = `semaphore:pipeline:${pipelineId}`;
    const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local current = tonumber(redis.call('get', key) or "0")
      if current < limit then
        redis.call('incr', key)
        return 1
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, key, maxConcurrency);
    return result === 1;
  }

  /**
   * Releases a slot in the pipeline's concurrency semaphore.
   */
  async releaseSlot(pipelineId: string): Promise<void> {
    const key = `semaphore:pipeline:${pipelineId}`;
    const script = `
      local key = KEYS[1]
      local current = tonumber(redis.call('get', key) or "0")
      if current > 0 then
        redis.call('decr', key)
      end
      return 1
    `;

    await this.redis.eval(script, 1, key);
  }

  /**
   * Closes all queue connections.
   */
  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}
