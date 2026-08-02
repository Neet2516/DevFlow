-- CreateTable
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineVersion" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "dagJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "pipelineVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dependsOn" TEXT[],
    "retryPolicy" JSONB NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL,
    "pipelineVersionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT,
    "status" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastHeartbeat" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PipelineVersion_pipelineId_createdAt_idx" ON "PipelineVersion"("pipelineId", "createdAt");

-- CreateIndex
CREATE INDEX "Job_pipelineVersionId_idx" ON "Job"("pipelineVersionId");

-- CreateIndex
CREATE INDEX "Execution_pipelineVersionId_status_idx" ON "Execution"("pipelineVersionId", "status");

-- CreateIndex
CREATE INDEX "Execution_status_startedAt_idx" ON "Execution"("status", "startedAt");

-- CreateIndex
CREATE INDEX "JobExecution_executionId_status_idx" ON "JobExecution"("executionId", "status");

-- CreateIndex
CREATE INDEX "JobExecution_workerId_status_idx" ON "JobExecution"("workerId", "status");

-- CreateIndex
CREATE INDEX "Worker_status_lastHeartbeat_idx" ON "Worker"("status", "lastHeartbeat");

-- AddForeignKey
ALTER TABLE "PipelineVersion" ADD CONSTRAINT "PipelineVersion_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_pipelineVersionId_fkey" FOREIGN KEY ("pipelineVersionId") REFERENCES "PipelineVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_pipelineVersionId_fkey" FOREIGN KEY ("pipelineVersionId") REFERENCES "PipelineVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobExecution" ADD CONSTRAINT "JobExecution_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
