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
    const whereClause = buildWhereClause(filters, userId, userRole);

    // Get overview metrics
    const [
      totalBookings,
      totalRevenue,
      activeConsultations,
      completedServices,
      averageRating,
      recentActivity
    ] = await Promise.all([
      // Total bookings
      prisma.serviceBooking.count({
        where: whereClause.booking
      }),

      // Total revenue
      prisma.payment.aggregate({
        where: {
          ...whereClause.payment,
          status: 'PAID'
        },
        _sum: { amount: true }
      }),

      // Active consultations
      prisma.videoConsultation.count({
        where: {
          ...whereClause.consultation,
          status: 'IN_PROGRESS'
        }
      }),

      // Completed services
      prisma.serviceBooking.count({
        where: {
          ...whereClause.booking,
          status: 'COMPLETED'
        }
      }),

      // Average rating
      prisma.serviceReview.aggregate({
        where: whereClause.review,
        _avg: { rating: true }
      }),

      // Recent activity (last 7 days)
      prisma.serviceBooking.findMany({
        where: {
          ...whereClause.booking,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          service: { select: { title: true, type: true } },
          client: { select: { firstName: true, lastName: true } },
          provider: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

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
    const whereClause = buildWhereClause(filters, userId, userRole);

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

    // Revenue by service type
    const revenueByService = await prisma.payment.groupBy({
      by: ['bookingId'],
      where: {
        ...whereClause.payment,
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    }).then(async (payments: Array<{ bookingId: string; _sum: { amount: number } }>) => {
      const serviceRevenue = new Map();
      for (const payment of payments) {
        const booking = await prisma.serviceBooking.findUnique({
          where: { id: payment.bookingId },
          include: { service: { select: { type: true } } }
        });
        if (booking?.service) {
          const current = serviceRevenue.get(booking.service.type) || 0;
          serviceRevenue.set(booking.service.type, current + (payment._sum.amount || 0));
        }
      }
      return Array.from(serviceRevenue.entries()).map(([type, revenue]) => ({
        serviceType: type,
        revenue
      }));
    });

    // Payment method distribution
    const paymentMethodStats = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        ...whereClause.payment,
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

    // Consultation metrics
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
      _count: { id: true },
      _avg: { duration: true },
      _sum: { duration: true }
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
          total: consultationStats._count.id,
          averageDuration: consultationStats._avg.duration,
          totalDuration: consultationStats._sum.duration
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

    // AI query analytics
    const aiQueryStats = await prisma.aIQuery.groupBy({
  by: ['type'],
      where: {
        ...(filters.dateRange && {
          createdAt: {
            gte: new Date(filters.dateRange.start),
            lte: new Date(filters.dateRange.end)
          }
        })
      },
      _count: { id: true },
      _avg: { confidence: true }
    });

    // Peak usage hours
    const peakHours = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as activity_count
      FROM (
        SELECT "createdAt" FROM "service_bookings"
        UNION ALL
        SELECT "createdAt" FROM "chat_messages"
        UNION ALL
        SELECT "createdAt" FROM "ai_queries"
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
  const baseWhere = filters.dateRange ? {
    createdAt: {
      gte: new Date(filters.dateRange.start),
      lte: new Date(filters.dateRange.end)
    }
  } : {};

  const roleBasedWhere = userRole === 'LAWYER' ? {
    OR: [
      { providerId: userId },
      { lawyerId: userId }
    ]
  } : userRole === 'PUBLIC' ? {
    clientId: userId
  } : {};

  return {
    booking: {
      ...baseWhere,
      ...roleBasedWhere,
      ...(filters.serviceType && { 
        service: { type: filters.serviceType } 
      })
    },
    payment: {
      ...baseWhere,
      ...(userRole === 'LAWYER' || userRole === 'PUBLIC' ? { userId } : {}),
      ...(filters.paymentStatus && { status: filters.paymentStatus })
    },
    consultation: {
      ...baseWhere,
      ...(userRole === 'LAWYER' ? { lawyerId: userId } : 
          userRole === 'PUBLIC' ? { clientId: userId } : {})
    },
    review: {
      ...baseWhere,
      ...(userRole === 'LAWYER' ? { targetId: userId } : 
          userRole === 'PUBLIC' ? { authorId: userId } : {})
    }
  };
}

export default {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getPerformanceAnalytics,
  getUserBehaviorAnalytics
};