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

const PIPELINE_SERVICE_URL    = process.env.PIPELINE_SERVICE_URL    || 'http://localhost:3001';
const EXECUTION_SERVICE_URL   = process.env.EXECUTION_SERVICE_URL   || 'http://localhost:3002';
const WS_SERVICE_URL          = process.env.WS_SERVICE_URL          || 'http://localhost:3003';
const AI_ANALYZER_SERVICE_URL = process.env.AI_ANALYZER_SERVICE_URL || 'http://localhost:3004';
const NOTIF_SERVICE_URL       = process.env.NOTIF_SERVICE_URL       || 'http://localhost:3005';
const GITHUB_ADAPTER_URL      = process.env.GITHUB_ADAPTER_URL      || 'http://localhost:3006';
const AUDIT_SERVICE_URL       = process.env.AUDIT_SERVICE_URL       || 'http://localhost:3007';

// POST /auth/login — issues a JWT (dev mode: no password check, just echoes sub)
app.post('/auth/login', express.json(), async (req, res) => {
  try {
    const { email = 'user@devflow.local', sub = 'user-1' } = req.body;
    if (!process.env.JWT_SECRET) {
      return res.json({ token: 'dev-mode-no-jwt-secret-set', email, sub, mode: 'dev' });
    }
    const { signToken } = await import('@devflow/auth');
    const token = signToken({ sub, email, role: 'user' });
    res.json({ token, email, sub });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GitHub Webhook trigger endpoint
app.use('/webhooks/github',
  createProxyMiddleware({ target: GITHUB_ADAPTER_URL, changeOrigin: true })
);

// Audit trail endpoint
app.use('/api/v1/audit',
  createProxyMiddleware({ target: AUDIT_SERVICE_URL, changeOrigin: true })
);

// Analytics performance endpoint
app.use('/api/v1/analytics',
  createProxyMiddleware({ target: EXECUTION_SERVICE_URL, changeOrigin: true })
);

// 1. AI Failure Analysis route
app.use('/api/v1/executions/:id/analysis',
  createProxyMiddleware({ target: AI_ANALYZER_SERVICE_URL, changeOrigin: true })
);

// 2. Notifications audit log route
app.use('/api/v1/notifications',
  createProxyMiddleware({ target: NOTIF_SERVICE_URL, changeOrigin: true })
);

// 3. Pipeline Execution trigger
app.use('/api/v1/pipelines/:id/executions',
  createProxyMiddleware({ target: EXECUTION_SERVICE_URL, changeOrigin: true })
);

// 4. Pipeline CRUD
app.use('/api/v1/pipelines',
  createProxyMiddleware({ target: PIPELINE_SERVICE_URL, changeOrigin: true })
);

// Pipeline Templates
app.use('/api/v1/templates',
  createProxyMiddleware({ target: PIPELINE_SERVICE_URL, changeOrigin: true })
);

// 5. Execution status + manual actions (retry / skip / restart)
app.use('/api/v1/executions',
  createProxyMiddleware({ target: EXECUTION_SERVICE_URL, changeOrigin: true })
);

// 6. WebSocket health passthrough
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
