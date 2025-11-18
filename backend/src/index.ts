import express, { Request, Response } from 'express';
import cors from 'cors';

import helmet from 'helmet';
import type { Express } from 'express';
const app: Express = express();
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
  const mem = process.memoryUsage();
  res.status(200).json({
    status: 'OK',
    message: 'Wakili Pro Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    memory: {
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      externalMB: Math.round(mem.external / 1024 / 1024),
      arrayBuffersMB: Math.round((mem.arrayBuffers || 0) / 1024 / 1024)
    }
  });
});

// (Optional) Heap snapshot endpoint for diagnostics (disable in production if not needed)
if (process.env.NODE_ENV !== 'production') {
  app.get('/heapdump', async (_req: Request, res: Response) => {
    try {
      // Dynamically import heapdump if available
      let heapdump: any;
      try {
        // @ts-expect-error: heapdump types may not be present, this is a dynamic/optional import
        heapdump = await import('heapdump');
      } catch (importErr) {
        return res.status(501).json({ error: 'heapdump module is not installed on this system.' });
      }
      const filename = `heapdump-${Date.now()}.heapsnapshot`;
      heapdump.writeSnapshot(filename, (err: any, filePath: string) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json({ message: 'Heap snapshot written', file: filePath });
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}

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

// Mount payments router
import paymentsRouter from './routes/payments';
app.use('/api/payments', paymentsRouter);

// Mount lawyer subscriptions router
// Deprecated: lawyerSubscriptionsRouter removed

// Mount document marketplace router
import documentMarketplaceRouter from './routes/documentMarketplace';
app.use('/api/documents', documentMarketplaceRouter);

// Mount notifications router
import notificationsRouter from './routes/notifications';
app.use('/api/notifications', notificationsRouter);

// Mount admin legal materials router
import adminLegalMaterialsRouter from './routes/admin/legalMaterialsRoutes';
app.use('/api/admin/legal-materials', adminLegalMaterialsRouter);

// Mount admin legal scraper router
import adminLegalScraperRouter from './routes/admin/legalScraperRoutes';
app.use('/api/admin/legal-scraper', adminLegalScraperRouter);

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

// Periodic memory usage logging (best practice for diagnostics)
setInterval(() => {
  const mem = process.memoryUsage();
  console.log('[MEMORY]', {
    rssMB: Math.round(mem.rss / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    externalMB: Math.round(mem.external / 1024 / 1024),
    arrayBuffersMB: Math.round((mem.arrayBuffers || 0) / 1024 / 1024)
  });
}, 60000); // Log every 60 seconds

// Start server - bind to 0.0.0.0 for cloud platforms
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(port, host, () => {
  console.log(`✅ Wakili Pro Backend running on ${host}:${port}`);
  console.log(`🌍 Health check: http://${host}:${port}/health`);
  console.log(`📡 API root: http://${host}:${port}/api`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Start legal scraper scheduler
import './services/legalScraperScheduler';

export default app;