
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Use Redis for rate limiting in production, fallback to in-memory for dev
let rateLimiter: ReturnType<typeof rateLimit> | ((req: Request, res: Response, next: NextFunction) => void);

if (process.env.NODE_ENV === 'production') {
  const redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    enableOfflineQueue: false
  });
  rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per windowMs
    store: new RedisStore({
      // @ts-ignore
      sendCommand: (...args: unknown[]) => (redisClient as Redis).call(...args),
    }),
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      success: false,
      message: 'Too many requests. Please try again later.'
    }
  });
} else {
  // Simple in-memory rate limiter for development
  interface RateLimitData {
    requests: number[];
    lastReset: number;
  }
  const rateLimitMap = new Map<string, RateLimitData>();
  const WINDOW_SIZE = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 30; // 30 requests per minute
  rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    let clientData = rateLimitMap.get(clientId);
    if (!clientData) {
      clientData = {
        requests: [],
        lastReset: now
      };
      rateLimitMap.set(clientId, clientData);
    }
    if (now - clientData.lastReset > WINDOW_SIZE) {
      clientData.requests = [];
      clientData.lastReset = now;
    }
    clientData.requests = clientData.requests.filter(
      timestamp => now - timestamp < WINDOW_SIZE
    );
    if (clientData.requests.length >= MAX_REQUESTS) {
      logger.warn(`Rate limit exceeded for IP: ${clientId}`);
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((WINDOW_SIZE - (now - clientData.lastReset)) / 1000)
      });
    }
    clientData.requests.push(now);
    if (Math.random() < 0.01) {
      for (const [id, data] of rateLimitMap.entries()) {
        if (now - data.lastReset > WINDOW_SIZE * 2) {
          rateLimitMap.delete(id);
        }
      }
    }
    next();
  };
}

export { rateLimiter };
