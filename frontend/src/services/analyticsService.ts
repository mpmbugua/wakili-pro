import { ApiResponse } from '@shared/types';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function makeRequest<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseURL}${path.startsWith('/') ? path : `/${path}`}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

export const analyticsService = {
  async fetchFeatureEventStats(): Promise<ApiResponse<EventStats>> {
    return makeRequest('/analytics/feature-events');
  },
  async logEvent(event: { type: string; details?: Record<string, unknown> }): Promise<void> {
    try {
      await makeRequest('/analytics/event', {
        method: 'POST',
        body: JSON.stringify(event)
      });
    } catch (error) {
      // Non-blocking: log error but do not throw
      console.error('Failed to log analytics event:', error);
    }
  }
};

// --- Types and Interfaces ---
export interface EventStats {
  aiChatMessages: number;
  aiChatAudio: number;
  aiChatByLanguage: Record<string, number>;
  emergencyInitiated: number;
  emergencySuccess: number;
  emergencyByLawyer: Record<string, number>;
  timeline: Array<{ date: string; aiChat: number; emergency: number }>;
}

interface AnalyticsQuery {
  dateRange?: {
    start: string;
    end: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'consultation' | 'payment' | 'registration' | 'service';
  description: string;
  timestamp: Date;
  amount?: number;
  service: {
    title: string;
    type: string;
  };
  client: {
    firstName: string;
    lastName: string;
  };
  provider: {
    firstName: string;
    lastName: string;
  };
  status: string;
  createdAt: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  consultations: number;
}

interface RevenueByService {
  serviceType: string;
  revenue: number;
  count: number;
}

interface PaymentMethodStats {
  method: string;
  count: number;
  percentage: number;
}

interface OverviewAnalytics {
  overview: {
    totalBookings: number;
    totalRevenue: number;
    activeConsultations: number;
    completedServices: number;
    averageRating: number;
  };
  recentActivity: RecentActivity[];
}

interface RevenueAnalytics {
  monthlyRevenue: MonthlyRevenue[];
  revenueByService: RevenueByService[];
  paymentMethodStats: PaymentMethodStats[];
}

interface PerformanceAnalytics {
  consultations: {
    total: number;
    averageDuration: number;
  };
  satisfaction: {
    averageRating: number;
    totalReviews: number;
  };
  responseTime: number;
}

interface RegistrationTrend {
  date: string;
  count: number;
  type: 'client' | 'lawyer';
}

interface PopularService {
  name: string;
  bookings: number;
  revenue: number;
}

interface AIQueryStat {
  type: string;
  count: number;
  averageResponseTime: number;
}

interface PeakHour {
  hour: number;
  activity: number;
  day: string;
}

interface UserBehaviorAnalytics {
  registrationTrends: RegistrationTrend[];
  popularServices: PopularService[];
  aiQueryStats: AIQueryStat[];
  peakHours: PeakHour[];
}

interface DashboardAnalytics extends OverviewAnalytics, RevenueAnalytics, UserBehaviorAnalytics {
  performance: PerformanceAnalytics;
}

