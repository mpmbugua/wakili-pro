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
    const { prisma } = await import('./utils/database');
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
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

app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to Wakili Pro API',
    version: '1.0.0',
    documentation: '/api/docs'
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
    // Test database connection
    const { prisma } = await import('./utils/database');
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize video signaling server
    try {
      new VideoSignalingServer(server);
      logger.info('Video signaling server initialized');
    } catch (error) {
      logger.warn('Video signaling server failed to initialize:', error);
      // Continue without video features for now
    }

    // Start server
    server.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
      logger.info(`WebSocket server enabled for video consultations`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
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