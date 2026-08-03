import express from 'express';
import cors from 'cors';
import { prisma } from '@devflow/db';
import { buildDag } from '@devflow/graph-engine';
import { PipelineDAG } from '@devflow/shared';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'pipeline' });
});

// Prometheus metrics endpoint (scrape target for Grafana/Prometheus)
app.get('/metrics', async (_req, res) => {
  try {
    // Import dynamically to avoid circular dep before full build
    const { registry } = await import('@devflow/metrics');
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  } catch {
    res.status(500).send('metrics unavailable');
  }
});

// Create Pipeline
app.post('/api/v1/pipelines', async (req, res) => {
  try {
    const { name, dag } = req.body as { name: string; dag: PipelineDAG };

    if (!name || typeof name !== 'string') {
      res.status(400).json({
        type: 'about:blank',
        title: 'Malformed Request',
        status: 400,
        detail: 'Pipeline name is required and must be a string.',
      });
      return;
    }

    if (!dag || !Array.isArray(dag.jobs)) {
      res.status(400).json({
        type: 'about:blank',
        title: 'Malformed Request',
        status: 400,
        detail: 'Pipeline DAG with an array of jobs is required.',
      });
      return;
    }

    // Run DAG validation
    const validation = buildDag(dag);
    if (!validation.isValid) {
      res.status(422).json({
        type: 'https://devflow.dev/errors/invalid-dag',
        title: 'Invalid DAG Definition',
        status: 422,
        detail: 'The provided pipeline DAG failed structural validation.',
        errors: validation.errors,
        cycles: validation.cycles,
        orphanedNodes: validation.orphanedNodes,
      });
      return;
    }

    // Persist in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create pipeline record
      const pipeline = await tx.pipeline.create({
        data: { name },
      });

      // 2. Create version record
      const version = await tx.pipelineVersion.create({
        data: {
          pipelineId: pipeline.id,
          dagJson: dag as any,
        },
      });

      // 3. Create jobs with scoped IDs to avoid cross-pipeline clashes
      const jobsData = dag.jobs.map((job) => ({
        id: `${version.id}_${job.id}`,
        pipelineVersionId: version.id,
        name: job.name,
        type: job.type,
        dependsOn: job.dependsOn.map((depId) => `${version.id}_${depId}`),
        retryPolicy: job.retryPolicy as any,
      }));

      await tx.job.createMany({
        data: jobsData,
      });

      return {
        pipelineId: pipeline.id,
        versionId: version.id,
      };
    });

    res.status(201).json({
      id: result.pipelineId,
      name,
      versionId: result.versionId,
    });
  } catch (error: any) {
    console.error('Error creating pipeline:', error);
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message || 'An unexpected error occurred.',
    });
  }
});

// List Pipelines
app.get('/api/v1/pipelines', async (req, res) => {
  try {
    const pipelines = await prisma.pipeline.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    res.json(pipelines.map((p) => ({
      id: p.id,
      name: p.name,
      versionId: p.versions[0]?.id,
      dag: p.versions[0]?.dagJson,
    })));
  } catch (error: any) {
    res.status(500).json({ type: 'about:blank', title: 'Internal Server Error', status: 500, detail: error.message });
  }
});

// Get Pipeline
app.get('/api/v1/pipelines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { jobs: true },
        },
      },
    });

    if (!pipeline) {
      res.status(404).json({
        type: 'about:blank',
        title: 'Resource Not Found',
        status: 404,
        detail: `Pipeline with ID "${id}" was not found.`,
      });
      return;
    }

    res.json(pipeline);
  } catch (error: any) {
    console.error('Error fetching pipeline:', error);
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message || 'An unexpected error occurred.',
    });
  }
});

app.listen(port, () => {
  console.log(`Pipeline service listening on port ${port}`);
});
