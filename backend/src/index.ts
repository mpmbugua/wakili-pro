import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import type { Express } from 'express';
import { createServer } from 'http';

// Import routes
import authRoutes from './routes/auth';

const app: Express = express();
const httpServer = createServer(app);
const port = parseInt(process.env.PORT || '5000', 10);

// Initialize Socket.IO
import { initializeWebSocket } from './services/socketService';
const io = initializeWebSocket(httpServer);

// Make io available to routes via middleware
app.use((req: any, _res, next) => {
  req.io = io;
  next();
});

// Basic middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
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

// Debug endpoint to test schema imports
app.get('/debug/schemas', (_req: Request, res: Response) => {
  try {
    const { RegisterSchema } = require('@wakili-pro/shared');
    res.json({
      success: true,
      registerSchemaExists: !!RegisterSchema,
      registerSchemaType: typeof RegisterSchema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Debug endpoint to test database connection
app.get('/debug/db-test', async (_req: Request, res: Response) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Try to count users
    const userCount = await prisma.user.count();
    
    await prisma.$disconnect();
    
    res.json({
      success: true,
      message: 'Database connection works',
      userCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Debug endpoint to get last registration error
app.get('/debug/last-error', async (req, res) => {
  const { getLastError } = await import('./controllers/simpleAuthController');
  getLastError(req, res);
});

// Debug endpoint to test Cloudinary configuration
app.get('/debug/cloudinary', (_req: Request, res: Response) => {
  const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  const isConfigured = !!(cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret);

  res.json({
    success: isConfigured,
    configured: isConfigured,
    cloud_name: cloudinaryConfig.cloud_name || 'NOT SET',
    has_api_key: !!cloudinaryConfig.api_key,
    has_api_secret: !!cloudinaryConfig.api_secret,
    message: isConfigured 
      ? 'Cloudinary is properly configured' 
      : 'Cloudinary credentials are missing. Check environment variables.',
  });
});


// Debug endpoint to test registration validation
app.post('/debug/register-test', async (req: Request, res: Response) => {
  const step = { current: 'start' };
  try {
    step.current = 'import-schema';
    const { RegisterSchema } = require('@wakili-pro/shared');
    
    step.current = 'import-password-validator';
    const { validatePassword } = require('./services/security/passwordPolicyService');
    
    step.current = 'import-bcrypt';
    const bcrypt = require('bcryptjs');
    
    step.current = 'import-prisma';
    const { PrismaClient } = require('@prisma/client');
    
    step.current = 'create-prisma-client';
    const prisma = new PrismaClient();
    
    step.current = 'validate-request';
    const validationResult = RegisterSchema.safeParse(req.body);
    if (!validationResult.success) {
      await prisma.$disconnect();
      return res.json({
        step: 'validation',
        success: false,
        errors: validationResult.error.issues
      });
    }
    
    step.current = 'validate-password-policy';
    const { password, phoneNumber, email, firstName, lastName, role } = validationResult.data;
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      await prisma.$disconnect();
      return res.json({
        step: 'passwordPolicy',
        success: false,
        errors: passwordCheck.errors
      });
    }
    
    step.current = 'check-existing-user';
    const existingUser = await prisma.user.findFirst({
      where: { phoneNumber }
    });
    if (existingUser) {
      await prisma.$disconnect();
      return res.json({
        step: 'existingUser',
        success: false,
        message: 'Phone number already exists'
      });
    }
    
    step.current = 'hash-password';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    step.current = 'create-user';
    const user = await prisma.user.create({
      data: {
        email: email || `${phoneNumber}@wakili.temp`,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        role,
        emailVerified: false
      }
    });
    
    step.current = 'disconnect-prisma';
    await prisma.$disconnect();
    
    step.current = 'complete';
    res.json({
      step: 'complete',
      success: true,
      message: 'User created successfully',
      userId: user.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      failedAtStep: step.current,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
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

// Mount user documents router
import userDocumentsRouter from './routes/userDocuments';
app.use('/api/user-documents', userDocumentsRouter);

// Mount notifications router
import notificationsRouter from './routes/notifications';
app.use('/api/notifications', notificationsRouter);

// Mount admin legal materials router
import adminLegalMaterialsRouter from './routes/admin/legalMaterialsRoutes';
app.use('/api/admin/legal-materials', adminLegalMaterialsRouter);

// Mount admin legal scraper router
import adminLegalScraperRouter from './routes/admin/legalScraperRoutes';
app.use('/api/admin/legal-scraper', adminLegalScraperRouter);

// Mount admin intelligent crawler router
import adminCrawlerRouter from './routes/admin/crawlerRoutes';
app.use('/api/admin/crawler', adminCrawlerRouter);

// Mount admin lawyer management router
import adminLawyerRouter from './routes/admin/lawyerAdminRoutes';
app.use('/api/admin/lawyers', adminLawyerRouter);

// Mount AI assistant routes
import aiRouter from './routes/ai';
app.use('/api/ai', aiRouter);

// Mount lawyers routes
import lawyersRouter from './routes/lawyers';
app.use('/api/lawyers', lawyersRouter);

// Mount marketplace routes
import marketplaceRouter from './routes/marketplace';
app.use('/api/marketplace', marketplaceRouter);

// Mount video consultation routes
import videoRouter from './routes/video';
app.use('/api/video', videoRouter);

// Mount users routes
import usersRouter from './routes/users';
app.use('/api/users', usersRouter);

// Mount analytics routes
import analyticsRouter from './routes/analytics';
app.use('/api/analytics', analyticsRouter);

// Mount subscription routes (Three-Tier Monetization)
import subscriptionRouter from './routes/subscriptions';
app.use('/api/subscriptions', subscriptionRouter);

// Mount certification routes (Document Certification Workflow)
import certificationRouter from './routes/certifications';
app.use('/api/certifications', certificationRouter);

// Mount service request routes (Connection Fee Business Model)
import serviceRequestRouter from './routes/serviceRequests';
app.use('/api/service-requests', serviceRequestRouter);

// Mount consultation routes
import consultationsRouter from './routes/consultations';
app.use('/api/consultations', consultationsRouter);

// Mount wallet routes
import walletRouter from './routes/wallet';
app.use('/api/wallet', walletRouter);

// Mount document review routes
import documentReviewRouter from './routes/documentReview';
app.use('/api/document-review', documentReviewRouter);

// Mount lawyer letterhead routes
import lawyerLetterheadRouter from './routes/lawyerLetterhead';
app.use('/api/lawyer/letterhead', lawyerLetterheadRouter);

// Mount document certification routes
import documentCertificationRouter from './routes/documentCertification';
app.use('/api/certification', documentCertificationRouter);

// Mount messages routes (Real-time messaging)
import messagesRouter from './routes/messages';
import devRouter from './routes/dev';
app.use('/api/messages', messagesRouter);

// Mount dev routes (Development utilities - only in dev/staging)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRouter);
}

// Mount article routes
import articlesRouter from './routes/articles';
app.use('/api/articles', articlesRouter);

// Setup routes (admin initialization)
import setupRouter from './routes/setup';
app.use('/api/setup', setupRouter);

// Auth routes (real implementation)
app.use('/api/auth', authRoutes);

// Root API endpoint
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      '/health',
      '/api',
      '/api/setup/*',
      '/api/auth/*',
      '/api/ai/*',
      '/api/lawyers/*',
      '/api/admin/lawyers/*',
      '/api/marketplace/*',
      '/api/video/*',
      '/api/users/*',
      '/api/analytics/*',
      '/api/payments/*',
      '/api/documents/*',
      '/api/notifications/*',
      '/api/subscriptions/*',
      '/api/certifications/*',
      '/api/consultations/*'
    ]
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
httpServer.listen(port, host, () => {
  console.log(`✅ Wakili Pro Backend running on ${host}:${port}`);
  console.log(`🌍 Health check: http://${host}:${port}/health`);
  console.log(`📡 API root: http://${host}:${port}/api`);
  console.log(`💬 WebSocket enabled for real-time messaging`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start scheduled jobs
  import('./services/scheduledJobs').then(({ ScheduledJobs }) => {
    ScheduledJobs.startAll();
  }).catch((error) => {
    console.error('❌ Failed to start scheduled jobs:', error);
  });

  // Start intelligent legal document crawler scheduler
  import('./services/crawlerScheduler').then(({ crawlerScheduler }) => {
    crawlerScheduler.start();
    const nextRun = crawlerScheduler.getNextRunTime();
    console.log(`📚 Legal document crawler scheduled: Daily at 5:00 PM`);
    console.log(`⏰ Next run: ${nextRun?.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}`);
  }).catch((error) => {
    console.error('❌ Failed to start crawler scheduler:', error);
  });
});

export default app;