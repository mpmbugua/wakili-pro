import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { getLocationFromIP } from '../services/geoLocationService';

/**
 * Track page view - works for both anonymous and authenticated users
 * POST /api/analytics/track-page
 */
export const trackPageView = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sessionId,
      page,
      pageName,
      referrer,
      userAgent,
      deviceType,
      browser,
      os,
      screenWidth,
      screenHeight,
      duration,
      scrollDepth
    } = req.body;

    // Get user ID if authenticated (from middleware)
    const userId = (req as AuthenticatedRequest).user?.id || null;

    // Extract IP address (anonymized to country/city level)
    const ipAddress = req.ip || req.socket.remoteAddress || null;

    // Get geographic location from IP
    const geoData = await getLocationFromIP(ipAddress);

    const pageView = await prisma.pageView.create({
      data: {
        sessionId,
        userId,
        page,
        pageName,
        referrer,
        userAgent,
        ipAddress,
        deviceType,
        browser,
        os,
        screenWidth,
        screenHeight,
        duration,
        scrollDepth,
        country: geoData.country,
        city: geoData.city
      }
    });

    // Update session page views count
    await prisma.userSession.update({
      where: { sessionId },
      data: {
        pageViewsCount: { increment: 1 },
        exitPage: page,
        updatedAt: new Date()
      }
    }).catch(() => {
      // Session might not exist yet, that's ok
    });

    res.json({
      success: true,
      data: { pageViewId: pageView.id }
    });

  } catch (error) {
    console.error('[Analytics] Track page view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track page view'
    });
  }
};

/**
 * Track user event (clicks, searches, form interactions, etc.)
 * POST /api/analytics/track-event
 */
export const trackEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sessionId,
      eventType,
      eventCategory,
      eventName,
      page,
      targetElement,
      eventValue,
      metadata,
      searchQuery,
      lawyerId,
      serviceType,
      documentId
    } = req.body;

    const userId = (req as AuthenticatedRequest).user?.id || null;

    const event = await prisma.userEvent.create({
      data: {
        sessionId,
        userId,
        eventType,
        eventCategory,
        eventName,
        page,
        targetElement,
        eventValue,
        metadata,
        searchQuery,
        lawyerId,
        serviceType,
        documentId
      }
    });

    // Update session events count
    await prisma.userSession.update({
      where: { sessionId },
      data: {
        eventsCount: { increment: 1 },
        updatedAt: new Date()
      }
    }).catch(() => {
      // Session might not exist yet, that's ok
    });

    res.json({
      success: true,
      data: { eventId: event.id }
    });

  } catch (error) {
    console.error('[Analytics] Track event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event'
    });
  }
};

/**
 * Initialize or update user session
 * POST /api/analytics/track-session
 */
export const trackSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sessionId,
      referralSource,
      referralCampaign,
      referralMedium,
      landingPage,
      deviceType,
      browser,
      os
    } = req.body;

    const userId = (req as AuthenticatedRequest).user?.id || null;

    // Get IP and geographic location
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const geoData = await getLocationFromIP(ipAddress);

    // Try to find existing session
    const existingSession = await prisma.userSession.findUnique({
      where: { sessionId }
    });

    if (existingSession) {
      // Update existing session
      const session = await prisma.userSession.update({
        where: { sessionId },
        data: {
          userId: userId || existingSession.userId, // Link user if they logged in
          duration: Math.floor((Date.now() - existingSession.startedAt.getTime()) / 1000),
          updatedAt: new Date()
        }
      });

      res.json({ success: true, data: { sessionId: session.sessionId } });
    } else {
      // Create new session with geolocation
      const session = await prisma.userSession.create({
        data: {
          sessionId,
          userId,
          referralSource,
          referralCampaign,
          referralMedium,
          landingPage,
          deviceType,
          browser,
          os,
          country: geoData.country,
          city: geoData.city
        }
      });

      res.json({ success: true, data: { sessionId: session.sessionId } });
    }

  } catch (error) {
    console.error('[Analytics] Track session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track session'
    });
  }
};

/**
 * Mark conversion (signup, booking, purchase)
 * POST /api/analytics/track-conversion
 */
export const trackConversion = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sessionId,
      conversionType,
      conversionValue
    } = req.body;

    await prisma.userSession.update({
      where: { sessionId },
      data: {
        converted: true,
        conversionType,
        conversionValue,
        updatedAt: new Date()
      }
    });

    res.json({ success: true });

  } catch (error) {
    console.error('[Analytics] Track conversion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track conversion'
    });
  }
};

/**
 * Get analytics overview for admin
 * GET /api/analytics/admin/overview
 */
export const getAdminAnalyticsOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate ? new Date(endDate as string) : new Date();

    // Total visitors (unique sessions)
    const totalSessions = await prisma.userSession.count({
      where: {
        startedAt: {
          gte: start,
          lte: end
        }
      }
    });

    // Total page views
    const totalPageViews = await prisma.pageView.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    // Total events
    const totalEvents = await prisma.userEvent.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    // Conversions
    const conversions = await prisma.userSession.count({
      where: {
        startedAt: { gte: start, lte: end },
        converted: true
      }
    });

    const conversionRate = totalSessions > 0 ? (conversions / totalSessions) * 100 : 0;

    // Total revenue from conversions
    const revenueData = await prisma.userSession.aggregate({
      where: {
        startedAt: { gte: start, lte: end },
        converted: true
      },
      _sum: {
        conversionValue: true
      }
    });

    // Top pages
    const pageViewsGrouped = await prisma.pageView.groupBy({
      by: ['page'],
      where: {
        createdAt: { gte: start, lte: end }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Top searches
    const searchEvents = await prisma.userEvent.groupBy({
      by: ['searchQuery'],
      where: {
        createdAt: { gte: start, lte: end },
        searchQuery: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Device breakdown
    const deviceBreakdown = await prisma.userSession.groupBy({
      by: ['deviceType'],
      where: {
        startedAt: { gte: start, lte: end }
      },
      _count: {
        id: true
      }
    });

    // Geographic data
    const geoData = await prisma.userSession.groupBy({
      by: ['country', 'city'],
      where: {
        startedAt: { gte: start, lte: end },
        country: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 20
    });

    // Daily breakdown
    const dailyStats = await prisma.analyticsSummary.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    res.json({
      success: true,
      data: {
        totalVisitors: totalSessions,
        totalPageViews,
        totalEvents,
        conversions,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        totalRevenue: revenueData._sum.conversionValue || 0,
        topPages: pageViewsGrouped.map(p => ({ page: p.page, views: p._count.id })),
        topSearches: searchEvents.filter(s => s.searchQuery).map(s => ({ query: s.searchQuery, count: s._count.id })),
        deviceBreakdown: {
          mobile: deviceBreakdown.find(d => d.deviceType === 'mobile')?._count.id || 0,
          tablet: deviceBreakdown.find(d => d.deviceType === 'tablet')?._count.id || 0,
          desktop: deviceBreakdown.find(d => d.deviceType === 'desktop')?._count.id || 0
        },
        geoData: geoData.map(g => ({ country: g.country, city: g.city, visitors: g._count.id })),
        dailyStats
      }
    });

  } catch (error) {
    console.error('[Analytics] Admin overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview'
    });
  }
};

/**
 * Export analytics data for AI training
 * GET /api/analytics/admin/export
 */
export const exportAnalyticsData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dataType, format, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: last 90 days
    const end = endDate ? new Date(endDate as string) : new Date();

    let data: any[] = [];

    switch (dataType) {
      case 'searches':
        data = await prisma.userEvent.findMany({
          where: {
            createdAt: { gte: start, lte: end },
            eventType: 'SEARCH',
            searchQuery: { not: null }
          },
          select: {
            searchQuery: true,
            page: true,
            userId: true,
            createdAt: true,
            metadata: true
          }
        });
        break;

      case 'user-journeys':
        data = await prisma.userSession.findMany({
          where: {
            startedAt: { gte: start, lte: end },
            converted: true
          },
          include: {
            user: {
              select: {
                id: true,
                role: true
              }
            }
          }
        });
        break;

      case 'page-analytics':
        data = await prisma.pageView.findMany({
          where: {
            createdAt: { gte: start, lte: end }
          },
          select: {
            page: true,
            pageName: true,
            duration: true,
            scrollDepth: true,
            referrer: true,
            deviceType: true,
            country: true,
            city: true,
            createdAt: true
          }
        });
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Invalid dataType. Options: searches, user-journeys, page-analytics'
        });
        return;
    }

    // Return as JSON or CSV
    if (format === 'csv') {
      // Convert to CSV (simplified - you'd want a proper CSV library)
      const csv = data.length > 0 ? [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).map(v => JSON.stringify(v)).join(','))
      ].join('\n') : '';

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${dataType}-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data,
        count: data.length
      });
    }

  } catch (error) {
    console.error('[Analytics] Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data'
    });
  }
};

/**
 * Link anonymous session to authenticated user
 * POST /api/analytics-tracking/link-session
 * Used when user logs in or signs up to connect their anonymous browsing to their account
 */
export const linkSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User must be authenticated to link session'
      });
      return;
    }

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
      return;
    }

    // Update session with user ID
    await prisma.userSession.updateMany({
      where: { sessionId },
      data: { userId }
    });

    // Update all page views from this session
    const updatedPageViews = await prisma.pageView.updateMany({
      where: { sessionId, userId: null },
      data: { userId }
    });

    // Update all events from this session
    const updatedEvents = await prisma.userEvent.updateMany({
      where: { sessionId, userId: null },
      data: { userId }
    });

    console.log(`[Analytics] Linked session ${sessionId} to user ${userId}: ${updatedPageViews.count} page views, ${updatedEvents.count} events`);

    res.json({
      success: true,
      data: {
        sessionId,
        userId,
        linkedPageViews: updatedPageViews.count,
        linkedEvents: updatedEvents.count
      }
    });

  } catch (error) {
    console.error('[Analytics] Session linking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link session'
    });
  }
};
