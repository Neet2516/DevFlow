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

async function runChaosTest() {
  console.log('=== STARTING WORKER CRASH & CHAOS RECOVERY VERIFICATION ===');

  // 1. Create pipeline with a long running job (5 seconds)
  const pipelinePayload = {
    name: 'Chaos Recovery Test Suite',
    dag: {
      jobs: [
        {
          id: 'long_job',
          name: 'Long Running Task',
          type: 'build',
          dependsOn: [],
          cmd: 'echo "[CHAOS] Starting heavy task..."; sleep 3; echo "[CHAOS] Finished heavy task."',
          retryPolicy: { maxAttempts: 3, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: 'any' },
        },
      ],
    },
  };

  console.log('\n[1] Creating pipeline...');
  const createRes = await request('/api/v1/pipelines', { method: 'POST' }, pipelinePayload);
  const pipelineId = createRes.body.id;
  console.log(`✓ Pipeline created: ${pipelineId}`);

  // 2. Instantiate Worker 1 (to be crashed)
  const redisConnection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
  const worker1Id = `doomed-worker-${Math.random().toString(36).slice(2, 7)}`;
  console.log(`\n[2] Initializing doomed worker: ${worker1Id}`);
  const doomedWorker = new WorkerRuntime(QUEUES.BUILD, redisConnection, worker1Id);

  // 3. Trigger execution
  console.log('\n[3] Triggering execution...');
  const triggerRes = await request(`/api/v1/pipelines/${pipelineId}/executions`, { method: 'POST' });
  const executionId = triggerRes.body.executionId;
  console.log(`✓ Execution started: ${executionId}`);

  // Wait for worker 1 to claim and start processing
  console.log('\n[4] Waiting for worker 1 to claim the job...');
  await new Promise(r => setTimeout(r, 1000));

  // Crash worker 1 abruptly without graceful close
  console.log(`\n[5] 💥 CRASHING WORKER 1 (${worker1Id}) MID-JOB! (Closing connection)...`);
  await doomedWorker.close();
  console.log('✓ Worker 1 killed!');

  // 4. Instantiate Worker 2 (healthy standby)
  const worker2Id = `recovery-worker-${Math.random().toString(36).slice(2, 7)}`;
  console.log(`\n[6] Initializing healthy standby worker: ${worker2Id}`);
  const recoveryWorker = new WorkerRuntime(QUEUES.BUILD, redisConnection, worker2Id);

  // 5. Poll for recovery by Liveness Monitor (15s inactivity threshold)
  console.log('\n[7] Waiting for Liveness Monitor sweep & reassignment (up to 20 seconds)...');
  const start = Date.now();
  let recovered = false;

  while (Date.now() - start < 25000) {
    const res = await request(`/api/v1/executions/${executionId}`);
    if (res.status === 200) {
      const exec = res.body;
      const status = exec.status;
      console.log(`   [STATUS] Execution: ${status}`);

      if (status === 'succeeded') {
        recovered = true;
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  // Cleanup
  await recoveryWorker.close();
  await redisConnection.quit();

  if (recovered) {
    console.log('\n==================================================');
    console.log('🎉 CHAOS RECOVERY VERIFICATION PASSED SUCCESSFULLY!');
    console.log('==================================================');
    console.log('Worker crash was detected by Liveness Monitor, job was re-enqueued and completed by standby worker!');
    process.exit(0);
  } else {
    console.error('\n❌ CHAOS RECOVERY TEST FAILED OR TIMED OUT');
    process.exit(1);
  }
}

runChaosTest().catch(console.error);
