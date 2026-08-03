import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Gateway health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'api-gateway' });
});

const PIPELINE_SERVICE_URL  = process.env.PIPELINE_SERVICE_URL  || 'http://localhost:3001';
const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL || 'http://localhost:3002';
const WS_SERVICE_URL        = process.env.WS_SERVICE_URL        || 'http://localhost:3003';

// 1. Pipeline Execution trigger (evaluated before general CRUD)
app.use('/api/v1/pipelines/:id/executions',
  createProxyMiddleware({ target: EXECUTION_SERVICE_URL, changeOrigin: true })
);

// 2. Pipeline CRUD
app.use('/api/v1/pipelines',
  createProxyMiddleware({ target: PIPELINE_SERVICE_URL, changeOrigin: true })
);

// 3. Execution status queries
app.use('/api/v1/executions',
  createProxyMiddleware({ target: EXECUTION_SERVICE_URL, changeOrigin: true })
);

// 4. WebSocket health passthrough (HTTP health check on WS service)
app.use('/health/ws',
  createProxyMiddleware({ target: WS_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/health/ws': '/health' } })
);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    type: 'about:blank',
    title: 'Not Found',
    status: 404,
    detail: `${req.method} ${req.path} is not a recognised gateway route.`,
  });
});

app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
