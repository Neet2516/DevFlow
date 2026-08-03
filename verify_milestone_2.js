const http = require('http');
const Redis = require('ioredis');

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

// GET utility
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
  console.log('--- Starting Milestone 2 End-to-End Execution Core Test ---');

  // Initialize Redis client on local dev port
  const redis = new Redis('redis://localhost:6379');

  // 1. Create a sequential multi-stage build pipeline
  const pipelinePayload = {
    name: 'multi-stage-build',
    dag: {
      jobs: [
        {
          id: 'build_frontend',
          name: 'Build Frontend React Application',
          type: 'build',
          dependsOn: [],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 1000, maxMs: 1000 }, retryableExitCodes: 'any' },
          cmd: 'echo "Starting frontend build..."; sleep 2; echo "Packing bundle..."; echo "Frontend compilation complete."',
        },
        {
          id: 'build_backend',
          name: 'Build Node.js Backend Service',
          type: 'build',
          dependsOn: ['build_frontend'],
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 1000, maxMs: 1000 }, retryableExitCodes: 'any' },
          cmd: 'echo "Compiling typescript backend..."; sleep 1; echo "Backend build successful!"',
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

  // 3. Poll execution status
  console.log(`\nPolling execution ${executionId} status...`);
  let retries = 30;
  let success = false;

  while (retries > 0) {
    const resStatus = await get(`http://localhost:3000/api/v1/executions/${executionId}`);
    console.log(`Poll [${30 - retries + 1}]: Status = ${resStatus.body.status}`);
    for (const je of resStatus.body.jobExecutions) {
      console.log(`  - Job: ${je.jobId} Status: ${je.status} Attempt: ${je.attempt}`);
    }

    if (resStatus.body.status === 'succeeded') {
      success = true;
      break;
    }

    if (resStatus.body.status === 'failed' || resStatus.body.status === 'cancelled') {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    retries--;
  }

  // 4. Retrieve and dump Event Bus Stream log
  console.log('\n--- Event Bus Redis Stream Logs ---');
  const streamData = await redis.xrange('job-events', '-', '+');
  console.log(`Total events captured on bus: ${streamData.length}`);

  for (const item of streamData) {
    const [id, fields] = item;
    let payload = null;
    for (let i = 0; i < fields.length; i += 2) {
      if (fields[i] === 'payload') {
        payload = JSON.parse(fields[i + 1]);
        break;
      }
    }

    if (payload) {
      if (payload.type === 'log.line') {
        console.log(`[EVENT] log.line: [${payload.jobId}] L${payload.lineNumber}: ${payload.line}`);
      } else {
        console.log(`[EVENT] ${payload.type}:`, payload);
      }
    }
  }

  await redis.quit();

  if (success) {
    console.log('\n--- E2E Execution Core Test Completed Successfully! ---');
  } else {
    console.error('\n--- E2E Execution Core Test Failed or Timed Out! ---');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('E2E Verification failed with error:', err);
  process.exit(1);
});
