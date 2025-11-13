import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@wakili-pro/shared';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  };
}

export const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '15m',
    issuer: 'wakili-pro',
    audience: 'wakili-pro-users'
  });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { 
    expiresIn: '7d',
    issuer: 'wakili-pro',
    audience: 'wakili-pro-users' 
  });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'wakili-pro',
      audience: 'wakili-pro-users'
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'wakili-pro',
      audience: 'wakili-pro-users'
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      firstName: '', // Will be populated by user lookup if needed
      lastName: ''   // Will be populated by user lookup if needed
    };
    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
      return;
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      firstName: '',
      lastName: ''
    };
  } catch (error) {
    // Ignore token errors for optional auth
    console.warn('Optional auth token validation failed:', error);
  }

  next();
};