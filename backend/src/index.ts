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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
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

// Initialize video signaling server
new VideoSignalingServer(server);

server.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`WebSocket server enabled for video consultations`);
});