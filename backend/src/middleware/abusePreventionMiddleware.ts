import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import * as abusePreventionService from '../services/abusePreventionService';
import * as analyticsService from '../services/analyticsService';
import { logger } from '../utils/logger';

const ABUSE_DETECTION_ENABLED = process.env.ABUSE_DETECTION_ENABLED !== 'false';

/**
 * Detect and prevent abuse patterns
 */
export const detectAbusePatterns = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!ABUSE_DETECTION_ENABLED) {
    next();
    return;
  }

  try {
    const userId = req.user?.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptLanguage = req.headers['accept-language'];

    // Generate device fingerprint
    const deviceFingerprint = abusePreventionService.generateDeviceFingerprint(userAgent, acceptLanguage);

    // Check IP reputation
    const ipFlagged = await abusePreventionService.checkIPReputation(ipAddress);
    if (ipFlagged) {
      logger.warn(`[AbuseDetection] Flagged IP: ${ipAddress}`);
      
      if (userId) {
        await abusePreventionService.flagSuspiciousActivity(userId, `flagged_ip:${ipAddress}`);
        await analyticsService.trackEvent('abuse_detected', { 
          reason: 'flagged_ip', 
          ipAddress 
        }, userId);
      }

      res.status(403).json({
        success: false,
        message: 'Access denied. Please contact support if you believe this is an error.',
        supportEmail: 'support@wakili-pro.com'
      });
      return;
    }

    // Check multi-account pattern (for signup/registration endpoints)
    if (req.body.phoneNumber || req.body.email) {
      const multiAccount = await abusePreventionService.checkMultiAccountPattern(
        req.body.phoneNumber,
        req.body.email
      );

      if (multiAccount) {
        logger.warn(`[AbuseDetection] Multi-account detected: phone=${req.body.phoneNumber}, email=${req.body.email}`);
        
        if (userId) {
          await analyticsService.trackEvent('abuse_detected', { 
            reason: 'multi_account' 
          }, userId);
        }

        res.status(403).json({
          success: false,
          message: 'Multiple accounts detected. Each user is allowed one account. Please contact support for assistance.',
          supportEmail: 'support@wakili-pro.com'
        });
        return;
      }
    }

    // Record login attempt if user is authenticated
    if (userId && req.method === 'POST' && (req.path.includes('/login') || req.path.includes('/auth'))) {
      await abusePreventionService.recordLoginAttempt(userId, ipAddress, deviceFingerprint);
    }

    // Store IP and device info in request for analytics
    (req as any).analyticsData = {
      ipAddress,
      deviceFingerprint,
      userAgent
    };

    next();
  } catch (error) {
    logger.error('[AbuseDetection] Error in abuse prevention middleware:', error);
    // Don't block request on error
    next();
  }
};

/**
 * Check if user is flagged for manual review
 */
export const checkSuspiciousFlag = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!ABUSE_DETECTION_ENABLED) {
    next();
    return;
  }

  const userId = req.user?.id;

  if (!userId) {
    next();
    return;
  }

  const requiresReview = await abusePreventionService.requiresManualReview(userId);

  if (requiresReview) {
    logger.warn(`[AbuseDetection] User ${userId} requires manual review`);
    
    res.status(403).json({
      success: false,
      message: 'Your account is under review. Please contact support for assistance.',
      supportEmail: 'support@wakili-pro.com',
      requiresManualReview: true
    });
    return;
  }

  next();
};
