import { ApiResponse } from '@shared/types';

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

class AnalyticsService {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics API error:', error);
      throw error;
    }
  }

  async getDashboardAnalytics(query: AnalyticsQuery): Promise<ApiResponse<DashboardAnalytics>> {
    const params = new URLSearchParams();
    if (query.dateRange) {
      params.append('startDate', query.dateRange.start);
      params.append('endDate', query.dateRange.end);
    }

    return this.makeRequest<DashboardAnalytics>(`/analytics/dashboard?${params}`);
  }

  async getRevenueAnalytics(query: AnalyticsQuery): Promise<ApiResponse<RevenueAnalytics>> {
    const params = new URLSearchParams();
    if (query.dateRange) {
      params.append('startDate', query.dateRange.start);
      params.append('endDate', query.dateRange.end);
    }

    return this.makeRequest<RevenueAnalytics>(`/analytics/revenue?${params}`);
  }

  async getPerformanceAnalytics(query: AnalyticsQuery): Promise<ApiResponse<PerformanceAnalytics>> {
    const params = new URLSearchParams();
    if (query.dateRange) {
      params.append('startDate', query.dateRange.start);
      params.append('endDate', query.dateRange.end);
    }

    return this.makeRequest<PerformanceAnalytics>(`/analytics/performance?${params}`);
  }

  async getUserBehaviorAnalytics(query: AnalyticsQuery): Promise<ApiResponse<UserBehaviorAnalytics>> {
    const params = new URLSearchParams();
    if (query.dateRange) {
      params.append('startDate', query.dateRange.start);
      params.append('endDate', query.dateRange.end);
    }

    return this.makeRequest<UserBehaviorAnalytics>(`/analytics/user-behavior?${params}`);
  }

  async exportAnalytics(query: AnalyticsQuery): Promise<ApiResponse<string>> {
    const params = new URLSearchParams();
    if (query.dateRange) {
      params.append('startDate', query.dateRange.start);
      params.append('endDate', query.dateRange.end);
    }

    return this.makeRequest<string>(`/analytics/export?${params}`);
  }
}

export const analyticsService = new AnalyticsService();