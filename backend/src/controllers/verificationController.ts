import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSMS } from '../services/smsService';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import * as abusePreventionService from '../services/abusePreventionService';
import * as analyticsService from '../services/analyticsService';

// In-memory code storage (use Redis in production)
const verificationCodes = new Map<string, { code: string; expiresAt: Date; phoneNumber: string }>();

/**
 * Send verification code via SMS
 */
export const sendVerificationCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { phoneNumber } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Validate phone number format
    if (!abusePreventionService.validatePhoneNumber(phoneNumber)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Use 254XXXXXXXXX' 
      });
      return;
    }

    // Check for multi-account abuse
    const isAbuse = await abusePreventionService.checkMultiAccountPattern(phoneNumber);
    if (isAbuse) {
      res.status(403).json({
        success: false,
        message: 'This phone number is already registered. Contact support if you need assistance.',
        supportEmail: 'support@wakili-pro.com'
      });
      return;
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code (use Redis in production)
    verificationCodes.set(userId, { code, expiresAt, phoneNumber });

    // Send SMS
    const smsMessage = `Your Wakili Pro verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;
    await sendSMS(phoneNumber, smsMessage);

    // Track analytics
    await analyticsService.trackEvent('phone_verification_code_sent', {
      phoneNumber: phoneNumber.substring(0, 7) + 'XXX', // Partial mask for privacy
    }, userId);

    logger.info(`[Verification] Code sent to ${phoneNumber} for user ${userId}`);

    res.json({
      success: true,
      message: 'Verification code sent via SMS',
      expiresIn: 600 // seconds
    });
  } catch (error) {
    logger.error('[Verification] Send code error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
};

/**
 * Verify SMS code
 */
export const verifyCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const stored = verificationCodes.get(userId);

    if (!stored) {
      res.status(400).json({ 
        success: false, 
        message: 'No verification code found. Please request a new code.' 
      });
      return;
    }

    // Check expiration
    if (new Date() > stored.expiresAt) {
      verificationCodes.delete(userId);
      res.status(400).json({ 
        success: false, 
        message: 'Verification code expired. Please request a new code.' 
      });
      return;
    }

    // Verify code
    if (code !== stored.code) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
      return;
    }

    // Mark phone as verified
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber: stored.phoneNumber,
        phoneVerified: true,
        phoneVerifiedAt: new Date()
      }
    });

    // Clean up
    verificationCodes.delete(userId);

    // Track analytics
    await analyticsService.trackEvent('phone_verified', {
      phoneNumber: stored.phoneNumber.substring(0, 7) + 'XXX'
    }, userId);

    logger.info(`[Verification] Phone verified for user ${userId}`);

    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    logger.error('[Verification] Verify code error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify code' });
  }
};

/**
 * Get verification status
 */
export const getVerificationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phoneNumber: true,
        phoneVerified: true,
        phoneVerifiedAt: true
      }
    });

    res.json({
      success: true,
      data: {
        phoneNumber: user?.phoneNumber,
        isVerified: user?.phoneVerified || false,
        verifiedAt: user?.phoneVerifiedAt
      }
    });
  } catch (error) {
    logger.error('[Verification] Get status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get verification status' });
  }
};
