import http from 'http';
import Redis from 'ioredis';
import { WorkerRuntime } from '@devflow/worker';
import { QUEUES } from '@devflow/shared';

const API_BASE = 'http://localhost:3000';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runE2E() {
  console.log('=== STARTING MULTI-JOB-TYPE E2E VERIFICATION ===');

  // 1. Create a 5-node pipeline with all 5 job types
  // DAG topology:
  //      build (build)
  //     /           \
  // test (test)   docker (docker)
  //     \           /
  //    script (script)
  //          |
  //    deploy (deploy)
  const pipelinePayload = {
    name: 'Multi-Job E2E Suite',
    dag: {
      jobs: [
        {
          id: 'job_build',
          name: 'Build Artifacts',
          type: 'build',
          dependsOn: [],
          cmd: 'echo "[BUILD] Compiling TypeScript source files..."; sleep 1; echo "[BUILD] Build successful."',
          retryPolicy: { maxAttempts: 3, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: 'any' },
        },
        {
          id: 'job_test',
          name: 'Unit & Integration Tests',
          type: 'test',
          dependsOn: ['job_build'],
          cmd: 'echo "[TEST] Running unit tests..."; sleep 1; echo "[TEST] All 42 tests passed."',
          retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: [1] },
        },
        {
          id: 'job_docker',
          name: 'Docker Image Build',
          type: 'docker',
          dependsOn: ['job_build'],
          cmd: 'echo "[DOCKER] Building container image v1.0.0..."; sleep 1; echo "[DOCKER] Image tagged and pushed."',
          retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: [1] },
        },
        {
          id: 'job_script',
          name: 'Post-Build DB Migration Script',
          type: 'script',
          dependsOn: ['job_test', 'job_docker'],
          cmd: 'echo "[SCRIPT] Running database migration script..."; sleep 1; echo "[SCRIPT] Migrations applied cleanly."',
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] },
        },
        {
          id: 'job_deploy',
          name: 'Production Deployment',
          type: 'deploy',
          dependsOn: ['job_script'],
          cmd: 'echo "[DEPLOY] Deploying bundle to Kubernetes cluster..."; sleep 1; echo "[DEPLOY] Rollout complete, 200 OK."',
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] },
        },
      ],
    },
  };

  console.log('\n[1] Posting pipeline to API Gateway (http://localhost:3000/api/v1/pipelines)...');
  const createRes = await request('/api/v1/pipelines', { method: 'POST' }, pipelinePayload);
  if (createRes.status !== 201) {
    console.error('Failed to create pipeline:', createRes);
    process.exit(1);
  }
  const pipelineId = createRes.body.id;
  console.log(`✓ Pipeline created! ID: ${pipelineId}`);

  // 2. Start worker runtimes for all 5 queues
  console.log('\n[2] Initializing Worker Runtimes for all 5 queues...');
  const redisConnection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

  const workers = [
    new WorkerRuntime(QUEUES.BUILD, redisConnection, `e2e-build-worker-${Math.random().toString(36).slice(2, 7)}`),
    new WorkerRuntime(QUEUES.TEST, redisConnection, `e2e-test-worker-${Math.random().toString(36).slice(2, 7)}`),
    new WorkerRuntime(QUEUES.DOCKER, redisConnection, `e2e-docker-worker-${Math.random().toString(36).slice(2, 7)}`),
    new WorkerRuntime(QUEUES.SCRIPT, redisConnection, `e2e-script-worker-${Math.random().toString(36).slice(2, 7)}`),
    new WorkerRuntime(QUEUES.DEPLOY, redisConnection, `e2e-deploy-worker-${Math.random().toString(36).slice(2, 7)}`),
  ];
  console.log('✓ All 5 Worker Runtimes registered and actively listening for jobs!');

  // 3. Trigger execution
  console.log(`\n[3] Triggering Execution for pipeline ${pipelineId}...`);
  const triggerRes = await request(`/api/v1/pipelines/${pipelineId}/executions`, { method: 'POST' });
  if (triggerRes.status !== 202) {
    console.error('Failed to trigger execution:', triggerRes);
    process.exit(1);
  }
  const executionId = triggerRes.body.executionId;
  console.log(`✓ Execution started! ID: ${executionId}`);

  // 4. Poll execution status until terminal
  console.log('\n[4] Polling execution status until completion...');
  const start = Date.now();
  let execution = null;

  while (Date.now() - start < 30000) {
    const res = await request(`/api/v1/executions/${executionId}`);
    if (res.status === 200) {
      execution = res.body;
      const status = execution.status;
      const finishedJobs = execution.jobExecutions.filter(j => j.status === 'succeeded').length;
      console.log(`   [STATUS] Execution: ${status} (${finishedJobs}/5 jobs succeeded)`);

      if (status === 'succeeded' || status === 'failed') {
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  // 5. Cleanup workers
  console.log('\n[5] Cleaning up workers...');
  for (const w of workers) {
    await w.close();
  }
  await redisConnection.quit();

  // 6. Assert result
  if (execution && execution.status === 'succeeded') {
    console.log('\n==================================================');
    console.log('🎉 MULTI-JOB E2E VERIFICATION PASSED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`Execution ID: ${execution.id}`);
    console.log('Job Summary:');
    for (const je of execution.jobExecutions) {
      console.log(`  - Job: ${je.jobId} | Status: ${je.status} | Worker: ${je.workerId}`);
    }
    process.exit(0);
  } else {
    console.error('\n❌ E2E VERIFICATION FAILED or TIMED OUT:', execution);
    process.exit(1);
  }
}

runE2E().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
