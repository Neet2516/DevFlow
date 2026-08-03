import { PipelineDAG } from '@devflow/shared';

export interface PipelineTemplate {
  id: string;
  name: string;
  category: 'Node.js' | 'Python' | 'Go' | 'Java';
  description: string;
  dag: PipelineDAG;
}

export const TEMPLATES: PipelineTemplate[] = [
  {
    id: 'nodejs-full-stack',
    name: 'Node.js Full Stack CI/CD',
    category: 'Node.js',
    description: 'Complete build, unit test, docker build, database migration script, and production deployment pipeline.',
    dag: {
      jobs: [
        {
          id: 'job_build',
          name: 'Compile & Bundle',
          type: 'build',
          dependsOn: [],
          cmd: 'echo "[BUILD] Compiling TypeScript source files..."; sleep 1; echo "[BUILD] Bundle generated dist/index.js."',
          retryPolicy: { maxAttempts: 3, backoff: { type: 'exponential', baseMs: 1000, maxMs: 30000 }, retryableExitCodes: 'any' },
        },
        {
          id: 'job_test',
          name: 'Unit & Integration Suite',
          type: 'test',
          dependsOn: ['job_build'],
          cmd: 'echo "[TEST] Running Jest integration tests..."; sleep 1; echo "[TEST] 27/27 tests passed successfully."',
          retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: [1] },
        },
        {
          id: 'job_docker',
          name: 'Build Container Image',
          type: 'docker',
          dependsOn: ['job_build'],
          cmd: 'echo "[DOCKER] Building container image v${TAG}..."; sleep 1; echo "[DOCKER] Image tagged and pushed to registry."',
          retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: [1] },
        },
        {
          id: 'job_script',
          name: 'DB Migration Script',
          type: 'script',
          dependsOn: ['job_test', 'job_docker'],
          cmd: 'echo "[SCRIPT] Applying database schema migrations..."; sleep 1; echo "[SCRIPT] Migrations applied cleanly."',
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] },
        },
        {
          id: 'job_deploy',
          name: 'Deploy to Kubernetes',
          type: 'deploy',
          dependsOn: ['job_script'],
          cmd: 'echo "[DEPLOY] Rolling out deployment to ${ENV} cluster..."; sleep 1; echo "[DEPLOY] Deployment successful, 200 OK."',
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] },
        },
      ],
    },
  },
  {
    id: 'python-microservice',
    name: 'Python FastAPI Pipeline',
    category: 'Python',
    description: 'Pytest suite, Docker image creation, and staging deployment.',
    dag: {
      jobs: [
        {
          id: 'job_test',
          name: 'Pytest & Flake8 Lint',
          type: 'test',
          dependsOn: [],
          cmd: 'echo "[TEST] Running pytest and ruff linter..."; sleep 1; echo "[TEST] 100% test coverage achieved."',
          retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: 'any' },
        },
        {
          id: 'job_docker',
          name: 'Container Build',
          type: 'docker',
          dependsOn: ['job_test'],
          cmd: 'echo "[DOCKER] Building FastAPI image..."; sleep 1; echo "[DOCKER] Pushed to Docker Hub."',
          retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: 'any' },
        },
        {
          id: 'job_deploy',
          name: 'Staging Deploy',
          type: 'deploy',
          dependsOn: ['job_docker'],
          cmd: 'echo "[DEPLOY] Deploying to AWS ECS staging task..."; sleep 1; echo "[DEPLOY] Health check 200 OK."',
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] },
        },
      ],
    },
  },
  {
    id: 'go-binary-release',
    name: 'Go Cloud-Native Release',
    category: 'Go',
    description: 'Go unit tests, cross-compilation binary build, and production release.',
    dag: {
      jobs: [
        {
          id: 'job_test',
          name: 'Go Test Suite',
          type: 'test',
          dependsOn: [],
          cmd: 'echo "[TEST] Running go test ./..."; sleep 1; echo "[TEST] PASS."',
          retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: 'any' },
        },
        {
          id: 'job_build',
          name: 'Go Cross Compile',
          type: 'build',
          dependsOn: ['job_test'],
          cmd: 'echo "[BUILD] Building CGO_ENABLED=0 linux/amd64 binary..."; sleep 1; echo "[BUILD] Compiled static binary devflow-go."',
          retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: 'any' },
        },
        {
          id: 'job_deploy',
          name: 'Binary Release Push',
          type: 'deploy',
          dependsOn: ['job_build'],
          cmd: 'echo "[DEPLOY] Uploading binary to GitHub Releases & S3..."; sleep 1; echo "[DEPLOY] Release published."',
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] },
        },
      ],
    },
  },
  {
    id: 'java-spring-enterprise',
    name: 'Java Spring Boot Enterprise',
    category: 'Java',
    description: 'Maven build, JUnit tests, Docker image build, and K8s rollout.',
    dag: {
      jobs: [
        {
          id: 'job_build',
          name: 'Maven Package Build',
          type: 'build',
          dependsOn: [],
          cmd: 'echo "[BUILD] Executing ./mvnw clean package..."; sleep 1; echo "[BUILD] Built app.jar successfully."',
          retryPolicy: { maxAttempts: 3, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: 'any' },
        },
        {
          id: 'job_test',
          name: 'JUnit & Spring Test Suite',
          type: 'test',
          dependsOn: ['job_build'],
          cmd: 'echo "[TEST] Executing JUnit 5 integration tests..."; sleep 1; echo "[TEST] All tests passed."',
          retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: 'any' },
        },
        {
          id: 'job_docker',
          name: 'Build OCI Container Image',
          type: 'docker',
          dependsOn: ['job_test'],
          cmd: 'echo "[DOCKER] Building Spring Boot layer OCI image..."; sleep 1; echo "[DOCKER] Pushed to artifact registry."',
          retryPolicy: { maxAttempts: 2, backoff: { type: 'fixed', baseMs: 1000, maxMs: 5000 }, retryableExitCodes: 'any' },
        },
        {
          id: 'job_deploy',
          name: 'Production Rollout',
          type: 'deploy',
          dependsOn: ['job_docker'],
          cmd: 'echo "[DEPLOY] Triggering kubectl rollout status deployment/spring-app..."; sleep 1; echo "[DEPLOY] Rollout completed successfully."',
          retryPolicy: { maxAttempts: 1, backoff: { type: 'fixed', baseMs: 0, maxMs: 0 }, retryableExitCodes: [] },
        },
      ],
    },
  },
];
