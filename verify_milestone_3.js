const { spawn } = require('child_process');
const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyStr = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: body ? JSON.parse(body) : null,
            });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
          });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- Starting Milestone 3 Distributed Failure Recovery Test ---');

  // Stop running build-workers that could interfere with this test
  console.log('(Note: Please ensure other build workers are stopped so they do not claim the job prematurely)');

  // 1. Create a simple test pipeline
  const pipelinePayload = {
    name: 'recovery-test-pipeline',
    dag: {
      jobs: [
        {
          id: 'recovery_job',
          name: 'Critical Recovery Task',
          type: 'build',
          dependsOn: [],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 1000, maxMs: 1000 }, retryableExitCodes: 'any' },
          cmd: 'ping 127.0.0.1 -n 6',
        },
      ],
    },
  };

  console.log('\nCreating pipeline...');
  const resPipeline = await post('http://localhost:3000/api/v1/pipelines', pipelinePayload);
  console.log('Create pipeline response:', resPipeline.status, resPipeline.body);

  if (resPipeline.status !== 201) {
    console.error('Failed to create pipeline');
    process.exit(1);
  }

  const pipelineId = resPipeline.body.id;

  // 2. Trigger pipeline execution
  console.log(`\nTriggering execution for pipeline: ${pipelineId}...`);
  const resExec = await post(`http://localhost:3000/api/v1/pipelines/${pipelineId}/executions`, {});
  console.log('Trigger execution response:', resExec.status, resExec.body);

  if (resExec.status !== 202) {
    console.error('Failed to trigger execution');
    process.exit(1);
  }

  const executionId = resExec.body.executionId;

  // 3. Start Worker A
  console.log('\nSpawning Worker A...');
  const workerA = spawn('node', ['verify_milestone_3_worker.js', 'worker_A']);
  workerA.stdout.on('data', (data) => {
    console.log(`[WORKER A STDOUT] ${data.toString().trim()}`);
  });
  workerA.stderr.on('data', (data) => {
    console.error(`[WORKER A STDERR] ${data.toString().trim()}`);
  });

  // 4. Poll until Worker A picks up the job
  console.log('\nWaiting for Worker A to start executing the job...');
  let jobRunningOnA = false;
  let pollRetries = 20;

  while (pollRetries > 0) {
    const resStatus = await get(`http://localhost:3000/api/v1/executions/${executionId}`);
    const je = resStatus.body.jobExecutions[0];
    console.log(`Poll: execution status = ${resStatus.body.status}, job status = ${je ? je.status : 'pending'}, assigned worker = ${je ? je.workerId : 'none'}`);

    if (je && je.status === 'running' && je.workerId === 'worker_A') {
      jobRunningOnA = true;
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
    pollRetries--;
  }

  if (!jobRunningOnA) {
    console.error('Timeout: Worker A did not start the job execution.');
    workerA.kill('SIGKILL');
    process.exit(1);
  }

  // 5. Force kill Worker A mid-job
  console.log('\n>>> FORCE KILLING WORKER A MID-JOB! <<<');
  workerA.kill('SIGKILL');
  console.log('Worker A terminated.');

  // 6. Poll and wait for liveness monitor to sweep worker_A and reschedule job back to pending
  console.log('\nWaiting for liveness monitor sweep (15s inactivity limit)...');
  let jobRescheduled = false;
  pollRetries = 25;

  while (pollRetries > 0) {
    const resStatus = await get(`http://localhost:3000/api/v1/executions/${executionId}`);
    const je = resStatus.body.jobExecutions[0];
    console.log(`Poll: execution status = ${resStatus.body.status}, job status = ${je ? je.status : 'pending'}, assigned worker = ${je ? je.workerId : 'none'}`);

    if (je && je.status === 'pending' && je.workerId === null) {
      jobRescheduled = true;
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    pollRetries--;
  }

  if (!jobRescheduled) {
    console.error('Timeout: Liveness monitor did not reschedule the job.');
    process.exit(1);
  }

  console.log('\n>>> SUCCESS: Liveness monitor detected dead Worker A and reset job execution to pending! <<<');

  // 7. Start Worker B to claim the rescheduled job
  console.log('\nSpawning Worker B to complete the task...');
  const workerB = spawn('node', ['verify_milestone_3_worker.js', 'worker_B']);
  workerB.stdout.on('data', (data) => {
    console.log(`[WORKER B STDOUT] ${data.toString().trim()}`);
  });
  workerB.stderr.on('data', (data) => {
    console.error(`[WORKER B STDERR] ${data.toString().trim()}`);
  });

  // 8. Poll until execution succeeds
  console.log('\nPolling execution status for final success...');
  let testSucceeded = false;
  pollRetries = 20;

  while (pollRetries > 0) {
    const resStatus = await get(`http://localhost:3000/api/v1/executions/${executionId}`);
    const je = resStatus.body.jobExecutions[0];
    console.log(`Poll: execution status = ${resStatus.body.status}, job status = ${je ? je.status : 'pending'}`);

    if (resStatus.body.status === 'succeeded') {
      testSucceeded = true;
      break;
    }

    if (resStatus.body.status === 'failed') {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    pollRetries--;
  }

  // 9. Clean up Worker B
  console.log('\nGracefully shutting down Worker B...');
  workerB.kill('SIGTERM');

  if (testSucceeded) {
    console.log('\n--- E2E Distributed Failure Recovery Test Completed Successfully! ---');
  } else {
    console.error('\n--- E2E Distributed Failure Recovery Test Failed! ---');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
