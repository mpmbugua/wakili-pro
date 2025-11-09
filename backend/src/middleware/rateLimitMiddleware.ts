import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RateLimitData {
  requests: number[];
  lastReset: number;
}

// Simple in-memory rate limiter
// In production, use Redis or a proper rate limiting service
const rateLimitMap = new Map<string, RateLimitData>();

const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  // Get or create rate limit data for this client
  let clientData = rateLimitMap.get(clientId);
  
  if (!clientData) {
    clientData = {
      requests: [],
      lastReset: now
    };
    rateLimitMap.set(clientId, clientData);
  }

  // Reset window if needed
  if (now - clientData.lastReset > WINDOW_SIZE) {
    clientData.requests = [];
    clientData.lastReset = now;
  }

  // Remove requests outside the current window
  clientData.requests = clientData.requests.filter(
    timestamp => now - timestamp < WINDOW_SIZE
  );

  // Check if limit exceeded
  if (clientData.requests.length >= MAX_REQUESTS) {
    logger.warn(`Rate limit exceeded for IP: ${clientId}`);
    
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((WINDOW_SIZE - (now - clientData.lastReset)) / 1000)
    });
  }

  // Add current request
  clientData.requests.push(now);
  
  // Clean up old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    for (const [id, data] of rateLimitMap.entries()) {
      if (now - data.lastReset > WINDOW_SIZE * 2) {
        rateLimitMap.delete(id);
      }
    }
  }

  next();
};