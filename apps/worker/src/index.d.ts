import { Redis } from 'ioredis';
export declare class WorkerRuntime {
    private worker;
    private redis;
    private workerId;
    private heartbeatInterval;
    private isProcessing;
    constructor(queueName: string, redisConnection: Redis, workerId: string);
    private initWorker;
    private updateWorkerStatus;
    private publishEvent;
    private executeJob;
    close(): Promise<void>;
}
