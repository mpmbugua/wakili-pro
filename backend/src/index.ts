import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Wakili Pro Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API root endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Wakili Pro API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// Basic auth endpoints (mock for now)
app.post('/api/auth/login', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Login endpoint ready',
    token: 'mock-token-for-testing'
  });
});

app.post('/api/auth/register', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Register endpoint ready'
  });
});

// Catch all
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: ['/health', '/api', '/api/auth/login', '/api/auth/register']
  });
});

// Start server - bind to 0.0.0.0 for cloud platforms
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(port, host, () => {
  console.log(`✅ Wakili Pro Backend running on ${host}:${port}`);
  console.log(`🌍 Health check: http://${host}:${port}/health`);
  console.log(`📡 API root: http://${host}:${port}/api`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;