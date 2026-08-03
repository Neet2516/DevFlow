import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { spawn } from 'child_process';
import { DevFlowEvent, STREAMS } from '@devflow/shared';
import { prisma } from '@devflow/db';

export class WorkerRuntime {
  private worker: Worker;
  private redis: Redis;
  private workerId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(queueName: string, redisConnection: Redis, workerId: string) {
    this.redis = redisConnection;
    this.workerId = workerId;

    this.worker = new Worker(
      queueName,
      async (job: Job) => {
        this.isProcessing = true;
        await this.updateWorkerStatus('busy');
        try {
          await this.executeJob(job);
        } finally {
          this.isProcessing = false;
          await this.updateWorkerStatus('idle');
        }
      },
      { connection: this.redis, concurrency: 1 }
    );

    // Bootstrap database check-in and heartbeat timer
    this.initWorker();
  }

  private async initWorker(): Promise<void> {
    try {
      await prisma.worker.upsert({
        where: { id: this.workerId },
        update: {
          status: 'idle',
          lastHeartbeat: new Date(),
          capacity: 1,
        },
        create: {
          id: this.workerId,
          status: 'idle',
          lastHeartbeat: new Date(),
          capacity: 1,
        },
      });

      console.log(`Worker [${this.workerId}] successfully registered in DB`);

      this.heartbeatInterval = setInterval(async () => {
        try {
          await prisma.worker.update({
            where: { id: this.workerId },
            data: { lastHeartbeat: new Date() },
          });
        } catch (err) {
          console.error(`Worker [${this.workerId}] heartbeat failure:`, err);
        }
      }, 5000);
    } catch (err) {
      console.error(`Worker [${this.workerId}] registration failed:`, err);
    }
  }

  private async updateWorkerStatus(status: 'idle' | 'busy' | 'offline'): Promise<void> {
    try {
      await prisma.worker.upsert({
        where: { id: this.workerId },
        update: { status, lastHeartbeat: new Date() },
        create: { id: this.workerId, status, capacity: 1, lastHeartbeat: new Date() },
      });
    } catch (err) {
      console.error(`Failed to update status for worker [${this.workerId}]:`, err);
    }
  }

  private async publishEvent(event: DevFlowEvent): Promise<void> {
    await this.redis.xadd(STREAMS.JOB_EVENTS, '*', 'payload', JSON.stringify(event));
  }

  private async executeJob(job: Job): Promise<void> {
    const { pipelineId, executionId, jobId, attempt, cmd } = job.data as {
      pipelineId: string;
      executionId: string;
      jobId: string;
      attempt: number;
      cmd?: string;
    };

    const jobExecutionId = job.id!;

    console.log(`Worker [${this.workerId}] started job execution: ${jobExecutionId}`);

    // 1. Publish job.started
    await this.publishEvent({
      type: 'job.started',
      pipelineId,
      executionId,
      jobId,
      jobExecutionId,
      attempt,
      workerId: this.workerId,
      sequence: 1,
      timestamp: new Date().toISOString(),
    });

    let sequence = 2;

    // 2. Spawn Subprocess
    const isWin = process.platform === 'win32';
    const shell = isWin ? 'cmd.exe' : 'sh';
    const args = isWin ? ['/d', '/s', '/c', cmd || 'echo "no command specified"'] : ['-c', cmd || 'echo "no command specified"'];

    const child = spawn(shell, args, {
      windowsVerbatimArguments: isWin,
    });

    // Log buffering (50ms windows)
    let logBuffer: string[] = [];
    let logTimer: NodeJS.Timeout | null = null;
    let lineCount = 0;

    const flushLogs = async () => {
      if (logBuffer.length === 0) return;
      const linesToFlush = [...logBuffer];
      logBuffer = [];

      for (const line of linesToFlush) {
        lineCount++;
        await this.publishEvent({
          type: 'log.line',
          pipelineId,
          executionId,
          jobId,
          jobExecutionId,
          lineNumber: lineCount,
          line,
          sequence: sequence++,
          timestamp: new Date().toISOString(),
        });
      }
    };

    const queueLog = (data: Buffer) => {
      const text = data.toString('utf8');
      const lines = text.split(/\r?\n/);
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      logBuffer.push(...lines);

      if (!logTimer) {
        logTimer = setTimeout(async () => {
          logTimer = null;
          await flushLogs();
        }, 50);
      }
    };

    child.stdout.on('data', queueLog);
    child.stderr.on('data', queueLog);

    const runProcess = new Promise<{ code: number | null; error?: Error }>((resolve) => {
      child.on('close', (code) => {
        resolve({ code });
      });
      child.on('error', (err) => {
        resolve({ code: null, error: err });
      });
    });

    try {
      const result = await runProcess;

      // Ensure all remaining logs are flushed
      if (logTimer) {
        clearTimeout(logTimer);
        logTimer = null;
      }
      await flushLogs();

      if (result.error || result.code !== 0) {
        const errorMsg = result.error ? result.error.message : `Exit code ${result.code}`;
        console.error(`Job execution failed: ${jobExecutionId} - ${errorMsg}`);

        await this.publishEvent({
          type: 'job.failed',
          pipelineId,
          executionId,
          jobId,
          jobExecutionId,
          attempt,
          exitCode: result.code ?? -1,
          error: errorMsg,
          sequence: sequence++,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log(`Job execution completed successfully: ${jobExecutionId}`);

        await this.publishEvent({
          type: 'job.completed',
          pipelineId,
          executionId,
          jobId,
          jobExecutionId,
          attempt,
          exitCode: 0,
          sequence: sequence++,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      await this.publishEvent({
        type: 'job.failed',
        pipelineId,
        executionId,
        jobId,
        jobExecutionId,
        attempt,
        exitCode: -2,
        error: err.message || 'Worker runner exception',
        sequence: sequence++,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async close(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Set status to offline on graceful shutdown
    await this.updateWorkerStatus('offline');
    await this.worker.close();
  }
}
