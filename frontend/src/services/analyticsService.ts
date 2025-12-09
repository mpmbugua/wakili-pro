import { ApiResponse } from '@shared/types';
import axiosInstance from '../lib/axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function makeRequest<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseURL}${path.startsWith('/') ? path : `/${path}`}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

interface EventProperties {
  [key: string]: any;
}

/**
 * Track analytics event (new freebie tracking system)
 */
export const trackEvent = async (
  eventName: string,
  properties: EventProperties = {}
): Promise<void> => {
  try {
    await axiosInstance.post('/analytics/track', {
      eventName,
      properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`
    });
  } catch (error) {
    // Non-blocking - log but don't throw
    console.warn('[Analytics] Failed to track event:', eventName, error);
  }
};

/**
 * Track freebie usage
 */
export const trackFreebieUsage = async (
  freebieType: 'first_ai_review' | 'first_service_request' | 'first_consult_discount' | 'first_pdf_download' | 'lawyer_quota',
  properties: EventProperties = {}
): Promise<void> => {
  await trackEvent('freebie_used', {
    freebieType,
    ...properties
  });
};

/**
 * Track quota exhaustion
 */
export const trackQuotaExhaustion = async (
  quotaType: 'ai_review' | 'pdf_download',
  tier: string,
  properties: EventProperties = {}
): Promise<void> => {
  await trackEvent('quota_exhausted', {
    quotaType,
    tier,
    ...properties
  });
};

/**
 * Track upgrade prompt shown
 */
export const trackUpgradePromptShown = async (
  currentTier: string,
  quotaType?: string,
  properties: EventProperties = {}
): Promise<void> => {
  await trackEvent('upgrade_prompt_shown', {
    currentTier,
    quotaType,
    ...properties
  });
};

/**
 * Track upgrade prompt dismissed
 */
export const trackUpgradePromptDismissed = async (
  currentTier: string,
  quotaType?: string,
  properties: EventProperties = {}
): Promise<void> => {
  await trackEvent('upgrade_prompt_dismissed', {
    currentTier,
    quotaType,
    ...properties
  });
};

/**
 * Track upgrade conversion
 */
export const trackUpgradeConversion = async (
  fromTier: string,
  toTier: string,
  trigger: string,
  properties: EventProperties = {}
): Promise<void> => {
  await trackEvent('upgrade_conversion', {
    fromTier,
    toTier,
    trigger,
    ...properties
  });
};

/**
 * Track page view
 */
export const trackPageView = async (
  pageName: string,
  properties: EventProperties = {}
): Promise<void> => {
  await trackEvent('page_view', {
    pageName,
    ...properties
  });
};

/**
 * Track button click
 */
export const trackButtonClick = async (
  buttonName: string,
  location: string,
  properties: EventProperties = {}
): Promise<void> => {
  await trackEvent('button_click', {
    buttonName,
    location,
    ...properties
  });
};

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

// Removed unused AnalyticsQuery interface

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

// Removed unused DashboardAnalytics interface

