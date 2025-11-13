import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const { statusCode = 500, message } = err;
  
  logger.error(err.message, {
    statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      status: 'error',
      message: statusCode === 500 ? 'Internal server error' : message,
    });
  } else {
    res.status(statusCode).json({
      status: 'error',
      message,
      stack: err.stack,
    });
  }
};