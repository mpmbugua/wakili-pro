// Shared TypeScript types for Wakili Pro Mobile

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'client' | 'lawyer' | 'admin';
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  activeConsultations: number;
  completedServices: number;
  averageRating: number;
}

export interface DashboardData {
  user: User;
  analytics: AnalyticsData;
}
