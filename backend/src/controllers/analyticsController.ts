import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

// Analytics query schemas
const AnalyticsFiltersSchema = z.object({
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  userId: z.string().optional(),
  serviceType: z.enum(['CONSULTATION', 'DOCUMENT_DRAFTING', 'LEGAL_REVIEW', 'IP_FILING', 'DISPUTE_MEDIATION', 'CONTRACT_NEGOTIATION']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED', 'FAILED']).optional()
});

// Dashboard overview analytics
export const getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const filters = AnalyticsFiltersSchema.parse(req.query);
    // Flattened where clause for serviceBooking
    const baseWhere: any = {};
    if (filters.dateRange) {
      baseWhere.createdAt = {
        gte: new Date(filters.dateRange.start),
        lte: new Date(filters.dateRange.end)
      };
    }
    if (userRole === 'LAWYER') {
      baseWhere.OR = [{ providerId: userId }, { lawyerId: userId }];
    } else if (userRole === 'PUBLIC') {
      baseWhere.clientId = userId;
    }
    if (filters.serviceType) {
      baseWhere['service'] = { type: filters.serviceType };
    }
    const totalBookings = await prisma.serviceBooking.count({ where: baseWhere });
    const totalRevenue = await prisma.payment.aggregate({ _sum: { amount: true }, where: { userId } });
    // VideoConsultation does not have a status field; count all for this lawyer
    const activeConsultations = await prisma.videoConsultation.count({ where: { lawyerId: userId } });
    const completedServices = await prisma.serviceBooking.count({ where: { ...baseWhere, status: 'COMPLETED' } });
    const averageRating = await prisma.serviceReview.aggregate({ _avg: { rating: true }, where: { targetId: userId } });
    const recentActivity = await prisma.serviceBooking.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 10 });

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          totalRevenue: totalRevenue._sum.amount || 0,
          activeConsultations,
          completedServices,
          averageRating: averageRating._avg.rating || 0
        },
        recentActivity
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching analytics'
    });
  }
};

// Revenue analytics with trends
export const getRevenueAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const filters = AnalyticsFiltersSchema.parse(req.query);

    // Revenue by month (last 12 months)
    const monthlyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM "payments"
      WHERE 
        status = 'PAID' AND
        "createdAt" >= NOW() - INTERVAL '12 months'
        ${userRole === 'LAWYER' ? prisma.$queryRaw`AND "userId" = ${userId}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `;

    // Revenue by service type (group by bookingId, then join to service type)
    const paymentWhere: any = { status: 'PAID' };
    if (userRole === 'LAWYER') paymentWhere.userId = userId;
    if (filters.paymentStatus) paymentWhere.status = filters.paymentStatus;
    if (filters.dateRange) {
      paymentWhere.createdAt = {
        gte: new Date(filters.dateRange.start),
        lte: new Date(filters.dateRange.end)
      };
    }
    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      select: { bookingId: true, amount: true }
    });
    const serviceRevenue = new Map();
    for (const payment of payments) {
      if (!payment.bookingId) continue;
      const booking = await prisma.serviceBooking.findUnique({
        where: { id: payment.bookingId },
        include: { service: { select: { type: true } } }
      });
      if (booking?.service) {
        const current = serviceRevenue.get(booking.service.type) || 0;
        serviceRevenue.set(booking.service.type, current + (payment.amount || 0));
      }
    }
    const revenueByService = Array.from(serviceRevenue.entries()).map(([type, revenue]) => ({
      serviceType: type,
      revenue
    }));

    // Payment method distribution
    const paymentMethodStats = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        ...paymentWhere,
        status: 'COMPLETED'
      },
      _count: { method: true },
      _sum: { amount: true }
    });

    res.json({
      success: true,
      data: {
        monthlyRevenue,
        revenueByService,
        paymentMethodStats
      }
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching revenue analytics'
    });
  }
};

// Performance analytics for lawyers
export const getPerformanceAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Access denied - lawyers only'
      });
      return;
    }

    const filters = AnalyticsFiltersSchema.parse(req.query);

    // Consultation metrics (VideoConsultation has no duration field, only count)
    const consultationStats = await prisma.videoConsultation.aggregate({
      where: {
        lawyerId: userId,
        ...(filters.dateRange && {
          createdAt: {
            gte: new Date(filters.dateRange.start),
            lte: new Date(filters.dateRange.end)
          }
        })
      },
      _count: { id: true }
    });

    // Client satisfaction (reviews)
    const satisfactionStats = await prisma.serviceReview.aggregate({
      where: {
        targetId: userId,
        ...(filters.dateRange && {
          createdAt: {
            gte: new Date(filters.dateRange.start),
            lte: new Date(filters.dateRange.end)
          }
        })
      },
      _count: { id: true },
      _avg: { rating: true }
    });

    // Response time analytics
    const responseTimeStats = await prisma.$queryRaw<Array<{avg_response_minutes: number}>>`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (first_message.created_at - booking.created_at))/60) as avg_response_minutes
      FROM "service_bookings" booking
      LEFT JOIN LATERAL (
        SELECT created_at 
        FROM "chat_messages" 
        WHERE "roomId" IN (
          SELECT id FROM "chat_rooms" WHERE "bookingId" = booking.id
        )
        AND "senderId" = ${userId}
        ORDER BY created_at ASC
        LIMIT 1
      ) first_message ON true
      WHERE booking."providerId" = ${userId}
      ${filters.dateRange ? prisma.$queryRaw`
        AND booking.created_at >= ${new Date(filters.dateRange.start)}
        AND booking.created_at <= ${new Date(filters.dateRange.end)}
      ` : prisma.$queryRaw``}
    `;

    // Booking conversion rate
    const conversionStats = await prisma.serviceBooking.groupBy({
      by: ['status'],
      where: {
        providerId: userId,
        ...(filters.dateRange && {
          createdAt: {
            gte: new Date(filters.dateRange.start),
            lte: new Date(filters.dateRange.end)
          }
        })
      },
      _count: { status: true }
    });

    res.json({
      success: true,
      data: {
        consultations: {
          total: consultationStats._count.id
        },
        satisfaction: {
          totalReviews: satisfactionStats._count.id,
          averageRating: satisfactionStats._avg.rating || 0
        },
        responseTime: responseTimeStats[0]?.avg_response_minutes || 0,
        conversionRate: conversionStats
      }
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching performance analytics'
    });
  }
};

// User behavior analytics
export const getUserBehaviorAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Access denied - admin only'
      });
      return;
    }

    const filters = AnalyticsFiltersSchema.parse(req.query);

    // User registration trends
    const registrationTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as new_users,
        COUNT(*) FILTER (WHERE role = 'LAWYER') as new_lawyers,
        COUNT(*) FILTER (WHERE role = 'PUBLIC') as new_clients
      FROM "users"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
    `;

    // Most popular services
    const popularServices = await prisma.marketplaceService.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: {
        bookings: { _count: 'desc' }
      },
      take: 10
    });

    // AI query analytics removed: aIQuery model does not exist
    const aiQueryStats = [];

    // Peak usage hours (without ai_queries)
    const peakHours = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as activity_count
      FROM (
        SELECT "createdAt" FROM "service_bookings"
        UNION ALL
        SELECT "createdAt" FROM "chat_messages"
      ) combined_activity
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `;

    res.json({
      success: true,
      data: {
        registrationTrends,
        popularServices,
        aiQueryStats,
        peakHours
      }
    });

  } catch (error) {
    console.error('User behavior analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching behavior analytics'
    });
  }
};

// Helper function to build where clauses based on user role and filters
function buildWhereClause(filters: Record<string, unknown>, userId: string, userRole?: string) {
  // buildWhereClause is no longer used; logic inlined above
  return {};
}

export default {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getPerformanceAnalytics,
  getUserBehaviorAnalytics
};