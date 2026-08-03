import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { spawn } from 'child_process';
import { DevFlowEvent, STREAMS } from '@devflow/shared';

export class WorkerRuntime {
  private worker: Worker;
  private redis: Redis;
  private workerId: string;

  constructor(queueName: string, redisConnection: Redis, workerId: string) {
    this.redis = redisConnection;
    this.workerId = workerId;

    this.worker = new Worker(
      queueName,
      async (job: Job) => {
        await this.executeJob(job);
      },
      { connection: this.redis, concurrency: 1 }
    );
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
    await this.worker.close();
  }
}
