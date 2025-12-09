import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { logger } from '../utils/logger';

/**
 * Require phone verification for lawyers
 */
export const requirePhoneVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user;

  if (!user) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
    return;
  }

  // TODO: Re-enable when phoneVerified field added to User schema
  // if (user.role === 'LAWYER' && !user.phoneVerified) {
  //   logger.warn(`[Auth] Phone verification required for lawyer ${user.id}`);
  //   
  //   res.status(403).json({
  //     success: false,
  //     message: 'Phone verification required to access this feature',
  //     verificationRequired: true,
  //     verificationUrl: '/api/verification/send-code'
  //   });
  //   return;
  // }

  next();
};

/**
 * Optionally suggest phone verification
 */
export const suggestPhoneVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user;

  // phoneVerified field doesn't exist in production schema
  // if (user && user.role === 'LAWYER' && !user.phoneVerified) {
  //   res.setHeader('X-Phone-Verification-Suggested', 'true');
  // }

  next();
};
