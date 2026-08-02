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

// Proxy middleware to forward /api/v1/pipelines to the pipeline microservice
const PIPELINE_SERVICE_URL = process.env.PIPELINE_SERVICE_URL || 'http://localhost:3001';

app.use(
  '/api/v1/pipelines',
  createProxyMiddleware({
    target: PIPELINE_SERVICE_URL,
    changeOrigin: true,
  })
);

// Fallback error handler
app.use((req, res) => {
  res.status(404).json({
    type: 'about:blank',
    title: 'Resource Not Found',
    status: 404,
    detail: 'The requested gateway endpoint does not exist.',
  });
});

app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
