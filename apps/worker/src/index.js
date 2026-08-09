"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerRuntime = void 0;
const bullmq_1 = require("bullmq");
const child_process_1 = require("child_process");
const shared_1 = require("@devflow/shared");
const db_1 = require("@devflow/db");
class WorkerRuntime {
    worker;
    redis;
    workerId;
    heartbeatInterval = null;
    isProcessing = false;
    constructor(queueName, redisConnection, workerId) {
        this.redis = redisConnection;
        this.workerId = workerId;
        this.worker = new bullmq_1.Worker(queueName, async (job) => {
            this.isProcessing = true;
            await this.updateWorkerStatus('busy');
            try {
                await this.executeJob(job);
            }
            finally {
                this.isProcessing = false;
                await this.updateWorkerStatus('idle');
            }
        }, { connection: this.redis, concurrency: 1 });
        // Bootstrap database check-in and heartbeat timer
        this.initWorker();
    }
    async initWorker() {
        try {
            await db_1.prisma.worker.upsert({
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
                    await db_1.prisma.worker.update({
                        where: { id: this.workerId },
                        data: { lastHeartbeat: new Date() },
                    });
                }
                catch (err) {
                    console.error(`Worker [${this.workerId}] heartbeat failure:`, err);
                }
            }, 5000);
        }
        catch (err) {
            console.error(`Worker [${this.workerId}] registration failed:`, err);
        }
    }
    async updateWorkerStatus(status) {
        try {
            await db_1.prisma.worker.upsert({
                where: { id: this.workerId },
                update: { status, lastHeartbeat: new Date() },
                create: { id: this.workerId, status, capacity: 1, lastHeartbeat: new Date() },
            });
        }
        catch (err) {
            console.error(`Failed to update status for worker [${this.workerId}]:`, err);
        }
    }
    async publishEvent(event) {
        await this.redis.xadd(shared_1.STREAMS.JOB_EVENTS, '*', 'payload', JSON.stringify(event));
    }
    async executeJob(job) {
        const { pipelineId, executionId, jobId, attempt, cmd } = job.data;
        const jobExecutionId = job.id;
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
        const child = (0, child_process_1.spawn)(shell, args, {
            windowsVerbatimArguments: isWin,
        });
        // Log buffering (50ms windows)
        let logBuffer = [];
        let logTimer = null;
        let lineCount = 0;
        const flushLogs = async () => {
            if (logBuffer.length === 0)
                return;
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
        // Automated Secret Redaction Engine
        const redactSecrets = (line) => {
            return line
                .replace(/(bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*/gi, '$1[REDACTED_BEARER_TOKEN]')
                .replace(/(password|passwd|secret|api_key|apikey|private_key)=\S+/gi, '$1=[REDACTED_SECRET]')
                .replace(/(AWS_SECRET_ACCESS_KEY|GITHUB_TOKEN|SLACK_WEBHOOK_URL)=\S+/gi, '$1=[REDACTED_SECRET]');
        };
        const queueLog = (data) => {
            const text = data.toString('utf8');
            const rawLines = text.split(/\r?\n/);
            if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
                rawLines.pop();
            }
            const lines = rawLines.map(redactSecrets);
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
        const runProcess = new Promise((resolve) => {
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
            }
            else {
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
        }
        catch (err) {
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
    async close() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        // Set status to offline on graceful shutdown
        await this.updateWorkerStatus('offline');
        await this.worker.close();
    }
}
exports.WorkerRuntime = WorkerRuntime;
//# sourceMappingURL=index.js.map