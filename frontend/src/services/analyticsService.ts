import { ApiResponse } from '@shared/types';

interface AnalyticsQuery {
  dateRange?: {
    start: string;
    end: string;
  };
}

interface DashboardAnalytics {
  overview: {
    totalBookings: number;
    totalRevenue: number;
    activeConsultations: number;
    completedServices: number;
    averageRating: number;
  };
  recentActivity: any[];
}

interface RevenueAnalytics {
  monthlyRevenue: any[];
  revenueByService: any[];
  paymentMethodStats: any[];
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

interface UserBehaviorAnalytics {
  registrationTrends: any[];
  popularServices: any[];
  aiQueryStats: any[];
  peakHours: any[];
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