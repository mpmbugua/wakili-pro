
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Use Redis for rate limiting if available, fallback to in-memory
let rateLimiter: ReturnType<typeof rateLimit> | ((req: Request, res: Response, next: NextFunction) => void);

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    const redisClient = new Redis(REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    
    redisClient.on('error', (err) => {
      logger.warn('Redis connection error, falling back to memory store:', err.message);
    });

    rateLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // limit each IP to 30 requests per windowMs
      store: new RedisStore({
        // @ts-ignore
        sendCommand: (...args: unknown[]) => (redisClient as Redis).call(...args),
      }),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests. Please try again later.'
      }
    });
    logger.info('Rate limiting using Redis store');
  } catch (error) {
    logger.warn('Failed to initialize Redis, using memory store:', error);
    rateLimiter = createMemoryRateLimiter();
  }
} else {
  logger.info('Redis not configured, using in-memory rate limiting');
  rateLimiter = createMemoryRateLimiter();
}

function createMemoryRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please try again later.'
    }
  });
}

// Severe rate limiter for sensitive endpoints (e.g., authentication)
export const severeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed attempts. Please try again later.'
  }
});

export { rateLimiter };
