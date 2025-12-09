import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import cron from 'node-cron';

interface EventProperties {
  [key: string]: string | number | boolean | object | null | undefined;
}

/**
 * Track analytics event (self-hosted)
 */
export async function trackEvent(
  eventName: string,
  properties?: EventProperties,
  userId?: string,
  sessionId?: string,
  deviceInfo?: object,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName,
        eventType: categorizeEvent(eventName),
        properties: properties as any,
        sessionId,
        deviceInfo: deviceInfo as any,
        ipAddress,
        userAgent
      }
    });

    logger.info(`[Analytics] Event tracked: ${eventName} ${userId ? `for user ${userId}` : ''}`);
  } catch (error) {
    logger.error(`[Analytics] Failed to track event ${eventName}:`, error);
  }
}

/**
 * Track freebie usage
 */
export async function trackFreebieUsage(
  userId: string,
  freebieType: string,
  properties?: EventProperties
): Promise<void> {
  await trackEvent('freebie_used', {
    freebie_type: freebieType,
    ...properties
  }, userId);
}

/**
 * Track quota exhaustion
 */
export async function trackQuotaExhaustion(
  userId: string,
  quotaType: string,
  tier: string,
  properties?: EventProperties
): Promise<void> {
  await trackEvent('quota_exhausted', {
    quota_type: quotaType,
    tier,
    ...properties
  }, userId);
}

/**
 * Track upgrade conversion
 */
export async function trackUpgradeConversion(
  userId: string,
  fromTier: string,
  toTier: string,
  trigger: string,
  properties?: EventProperties
): Promise<void> {
  await trackEvent('subscription_upgraded', {
    from_tier: fromTier,
    to_tier: toTier,
    trigger,
    ...properties
  }, userId);
}

/**
 * Track upgrade prompt shown
 */
export async function trackUpgradePromptShown(
  userId: string,
  currentTier: string,
  trigger: string,
  properties?: EventProperties
): Promise<void> {
  await trackEvent('upgrade_prompt_shown', {
    current_tier: currentTier,
    trigger,
    ...properties
  }, userId);
}

/**
 * Track upgrade prompt dismissed
 */
export async function trackUpgradePromptDismissed(
  userId: string,
  currentTier: string,
  properties?: EventProperties
): Promise<void> {
  await trackEvent('upgrade_prompt_dismissed', {
    current_tier: currentTier,
    ...properties
  }, userId);
}

/**
 * Categorize event type
 */
function categorizeEvent(eventName: string): string {
  if (eventName.includes('freebie')) return 'freebie';
  if (eventName.includes('quota')) return 'quota';
  if (eventName.includes('upgrade') || eventName.includes('subscription')) return 'conversion';
  if (eventName.includes('payment')) return 'payment';
  if (eventName.includes('review') || eventName.includes('consultation')) return 'service';
  return 'other';
}

/**
 * Get analytics insights for a user
 */
export async function getUserAnalytics(userId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      userId,
      createdAt: { gte: since }
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    totalEvents: events.length,
    eventsByType: groupBy(events, 'eventType'),
    freebiesUsed: events.filter(e => e.eventType === 'freebie').length,
    quotaExhaustions: events.filter(e => e.eventName === 'quota_exhausted').length,
    upgradePromptsShown: events.filter(e => e.eventName === 'upgrade_prompt_shown').length
  };
}

/**
 * Get platform-wide analytics
 */
export async function getPlatformAnalytics(days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    select: {
      eventName: true,
      eventType: true,
      userId: true,
      createdAt: true
    }
  });

  const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;

  return {
    totalEvents: events.length,
    uniqueUsers,
    eventsByType: groupBy(events, 'eventType'),
    topEvents: getTopEvents(events, 10),
    freebieConversionRate: calculateFreebieConversionRate(events)
  };
}

/**
 * Archive old analytics events (12+ months)
 */
export async function archiveOldEvents(): Promise<number> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Get old events
  const oldEvents = await prisma.analyticsEvent.findMany({
    where: { createdAt: { lt: twelveMonthsAgo } }
  });

  if (oldEvents.length === 0) {
    logger.info('[Analytics] No events to archive');
    return 0;
  }

  // Copy to archive
  await prisma.analyticsEventArchive.createMany({
    data: oldEvents.map(event => ({
      id: event.id,
      userId: event.userId,
      eventName: event.eventName,
      eventType: event.eventType,
      properties: event.properties,
      sessionId: event.sessionId,
      deviceInfo: event.deviceInfo,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      createdAt: event.createdAt
    }))
  });

  // Delete from main table
  await prisma.analyticsEvent.deleteMany({
    where: { createdAt: { lt: twelveMonthsAgo } }
  });

  logger.info(`[Analytics] Archived ${oldEvents.length} old events`);
  return oldEvents.length;
}

/**
 * Schedule automatic archiving (runs monthly)
 */
export function scheduleAutoArchiving(): void {
  // Run on 1st of every month at 2:00 AM
  cron.schedule('0 2 1 * *', async () => {
    logger.info('[Analytics] Running scheduled event archiving');
    await archiveOldEvents();
  });

  logger.info('[Analytics] Auto-archiving scheduled');
}

// Helper functions
function groupBy(array: any[], key: string): Record<string, number> {
  return array.reduce((acc, item) => {
    const value = item[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function getTopEvents(events: any[], limit: number): Array<{ eventName: string; count: number }> {
  const counts = groupBy(events, 'eventName');
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([eventName, count]) => ({ eventName, count }));
}

function calculateFreebieConversionRate(events: any[]): number {
  const freebiesUsed = events.filter(e => e.eventName === 'freebie_used').length;
  const upgradesCompleted = events.filter(e => e.eventName === 'subscription_upgraded').length;

  if (freebiesUsed === 0) return 0;
  return Math.round((upgradesCompleted / freebiesUsed) * 100);
}
