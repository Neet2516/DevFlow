import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
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

// POST /auth/login — issues a JWT (dev mode: no password check, just echoes sub)
app.post('/auth/login', express.json(), async (req, res) => {
  try {
    const { email = 'user@devflow.local', sub = 'user-1' } = req.body;
    if (!process.env.JWT_SECRET) {
      // Dev mode: return a mock token indicator
      return res.json({ token: 'dev-mode-no-jwt-secret-set', email, sub, mode: 'dev' });
    }
    const { signToken } = await import('@devflow/auth');
    const token = signToken({ sub, email, role: 'user' });
    res.json({ token, email, sub });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 1. Pipeline Execution trigger
app.use('/api/v1/pipelines/:id/executions',
  createProxyMiddleware({ target: EXECUTION_SERVICE_URL, changeOrigin: true })
);

// 2. Pipeline CRUD
app.use('/api/v1/pipelines',
  createProxyMiddleware({ target: PIPELINE_SERVICE_URL, changeOrigin: true })
);

// 3. Execution status + manual actions (retry / skip / restart)
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
