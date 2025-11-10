import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow all origins in production for now
app.use(cors({
  origin: true, // Allow all origins temporarily for deployment
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (no database dependency)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Database health check endpoint
app.get('/health/db', async (_req: Request, res: Response) => {
  try {
    const { testDatabaseConnection } = await import('./utils/database');
    const isConnected = await testDatabaseConnection();
    
    if (isConnected) {
      res.status(200).json({ 
        status: 'OK', 
        database: 'connected',
        url: process.env.DATABASE_URL ? 'configured' : 'missing',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({ 
        status: 'UNAVAILABLE', 
        database: 'disconnected',
        url: process.env.DATABASE_URL ? 'configured' : 'missing',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import lawyerRoutes from './routes/lawyers';
import marketplaceRoutes from './routes/marketplace';
import paymentRoutes from './routes/payments';
import chatRoutes from './routes/chat';
import videoRoutes from './routes/video';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';

// API status endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to Wakili Pro API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      database: '/health/db',
      auth: '/api/auth',
      users: '/api/users'
    }
  });
});

// Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const port = config.port || 5000;

// Create HTTP server for Socket.IO integration
import { createServer } from 'http';
import { VideoSignalingServer } from './services/videoSignalingService';

const server = createServer(app);

// Graceful startup with error handling
async function startServer() {
  try {
    logger.info('Starting Wakili Pro Backend...');

    // Test database connection (non-blocking)
    const { testDatabaseConnection } = await import('./utils/database');
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      logger.info('Database connected successfully');
    } else {
      logger.warn('Database not available - some features may be limited');
    }

    // Initialize video signaling server
    try {
      new VideoSignalingServer(server);
      logger.info('Video signaling server initialized');
    } catch (error) {
      logger.warn('Video signaling server failed to initialize:', error);
      // Continue without video features for now
    }

    // Start server regardless of database status
    server.listen(port, () => {
      logger.info(`✅ Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: ${dbConnected ? '✅ Connected' : '⚠️  Not available'}`);
      logger.info(`Health check: http://localhost:${port}/health`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    
    // Try to start basic server without features
    try {
      server.listen(port, () => {
        logger.info(`🆘 Basic server started on port ${port} (limited functionality)`);
      });
    } catch (basicError) {
      logger.error('❌ Complete startup failure:', basicError);
      process.exit(1);
    }
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();