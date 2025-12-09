import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const MAX_ACCOUNTS_PER_PHONE = parseInt(process.env.MAX_ACCOUNTS_PER_PHONE || '1');
const MAX_ACCOUNTS_PER_IP = 5;
const SUSPICIOUS_IP_PATTERNS = ['vpn', 'proxy', 'tor']; // Extend with IP reputation API

/**
 * Validate Kenyan phone number format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Kenya format: 254XXXXXXXXX (9 digits after 254)
  const kenyanPhoneRegex = /^254[17]\d{8}$/;
  return kenyanPhoneRegex.test(phoneNumber);
}

/**
 * Check IP reputation and flag suspicious IPs
 */
export async function checkIPReputation(ipAddress: string): Promise<boolean> {
  if (!ipAddress) return false;

  // Check against known patterns (in production, use IP reputation API)
  const isSuspicious = SUSPICIOUS_IP_PATTERNS.some(pattern => 
    ipAddress.toLowerCase().includes(pattern)
  );

  if (isSuspicious) {
    logger.warn(`[AbuseDetection] Suspicious IP detected: ${ipAddress}`);
    return true;
  }

  // Check how many accounts use this IP
  const accountsFromIP = await prisma.user.count({
    where: { lastLoginIP: ipAddress }
  });

  if (accountsFromIP >= MAX_ACCOUNTS_PER_IP) {
    logger.warn(`[AbuseDetection] Too many accounts from IP ${ipAddress}: ${accountsFromIP}`);
    return true;
  }

  return false;
}

/**
 * Generate device fingerprint from request headers
 */
export function generateDeviceFingerprint(userAgent: string, acceptLanguage?: string): string {
  const components = [
    userAgent || 'unknown',
    acceptLanguage || 'unknown'
  ].join('|');

  return crypto.createHash('sha256').update(components).digest('hex').substring(0, 32);
}

/**
 * Flag suspicious activity on user account
 */
export async function flagSuspiciousActivity(
  userId: string,
  reason: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { suspiciousActivityFlag: true }
  });

  logger.warn(`[AbuseDetection] User ${userId} flagged for: ${reason}`);

  // TODO: Send alert to admin dashboard
  // TODO: Send email to compliance team
}

/**
 * Check for multi-account patterns (same phone/email)
 */
export async function checkMultiAccountPattern(
  phoneNumber?: string,
  email?: string
): Promise<boolean> {
  if (!phoneNumber && !email) return false;

  const conditions: any[] = [];

  if (phoneNumber) {
    conditions.push({ phoneNumber });
  }

  if (email) {
    conditions.push({ email });
  }

  const existingAccounts = await prisma.user.findMany({
    where: { OR: conditions },
    select: { id: true, phoneNumber: true, email: true, suspiciousActivityFlag: true }
  });

  if (existingAccounts.length === 0) return false;

  // Check phone number limit
  if (phoneNumber) {
    const accountsWithPhone = existingAccounts.filter(acc => acc.phoneNumber === phoneNumber);
    
    if (accountsWithPhone.length >= MAX_ACCOUNTS_PER_PHONE) {
      logger.warn(`[AbuseDetection] Multi-account detected for phone ${phoneNumber}: ${accountsWithPhone.length} accounts`);
      return true;
    }
  }

  // Check if any existing account is flagged
  const hasFlaggedAccount = existingAccounts.some(acc => acc.suspiciousActivityFlag);
  if (hasFlaggedAccount) {
    logger.warn(`[AbuseDetection] Attempting to create account with flagged phone/email`);
    return true;
  }

  return false;
}

/**
 * Record login attempt with IP and device fingerprint
 */
export async function recordLoginAttempt(
  userId: string,
  ipAddress: string,
  deviceFingerprint: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginIP: ipAddress,
      deviceFingerprint
    }
  });

  logger.info(`[AbuseDetection] Login recorded for user ${userId} from IP ${ipAddress}`);
}

/**
 * Check if user requires manual review (support override)
 */
export async function requiresManualReview(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspiciousActivityFlag: true }
  });

  return user?.suspiciousActivityFlag || false;
}

/**
 * Clear suspicious flag (admin action)
 */
export async function clearSuspiciousFlag(userId: string, adminId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { suspiciousActivityFlag: false }
  });

  logger.info(`[AbuseDetection] Suspicious flag cleared for user ${userId} by admin ${adminId}`);
}
