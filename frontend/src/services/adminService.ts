const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Admin Statistics
export interface AdminStats {
  totalUsers: number;
  totalLawyers: number;
  pendingVerifications: number;
  activeConsultations: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface AdminAnalytics {
  overview: AdminStats;
  userGrowth: Array<{
    date: string;
    users: number;
    lawyers: number;
  }>;
  revenue: Array<{
    month: string;
    amount: number;
  }>;
}

export interface UserBehaviorAnalytics {
  pageViews: Array<{
    page: string;
    views: number;
    avgTime: number;
  }>;
  userFlows: Array<{
    from: string;
    to: string;
    count: number;
  }>;
  dropOffPoints: Array<{
    step: string;
    dropOffRate: number;
  }>;
}

// User Management
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'PUBLIC' | 'LAWYER' | 'ADMIN';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  location?: string;
  totalBookings: number;
  totalSpent: number;
}

// Lawyer Verification
export interface LawyerApplication {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  appliedAt: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  licenseNumber: string;
  barAssociation: string;
  yearsExperience: number;
  specializations: string[];
  education: string;
  currentFirm?: string;
  documents: {
    license: { url: string; uploaded: boolean };
    certificate: { url: string; uploaded: boolean };
    id: { url: string; uploaded: boolean };
    cv: { url: string; uploaded: boolean };
  };
  adminNotes?: string;
  internalScore?: number;
}

// System Settings
export interface SystemSettings {
  platform: {
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    requireEmailVerification: boolean;
    maxUploadSize: number;
    sessionTimeout: number;
  };
  features: {
    aiAssistantEnabled: boolean;
    videoConsultationEnabled: boolean;
    paymentProcessingEnabled: boolean;
    multiLanguageEnabled: boolean;
    mobileAppEnabled: boolean;
  };
  security: {
    passwordMinLength: number;
    requireTwoFactor: boolean;
    maxLoginAttempts: number;
    sessionSecurityLevel: 'low' | 'medium' | 'high';
    ipWhitelistEnabled: boolean;
  };
  communications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
  };
  integrations: {
    mpesaEnabled: boolean;
    firebaseEnabled: boolean;
    cloudinaryEnabled: boolean;
    twilioEnabled: boolean;
  };
}

class AdminService {
  // Dashboard Stats
  async getAdminStats(): Promise<AdminStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }

  // User Management
  async getUsers(filters?: {
    search?: string;
    role?: string;
    verificationStatus?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ users: AdminUser[]; total: number; page: number; totalPages: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.role) queryParams.append('role', filters.role);
      if (filters?.verificationStatus) queryParams.append('verificationStatus', filters.verificationStatus);
      if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, action: 'activate' | 'deactivate' | 'verify' | 'reject', notes?: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, notes })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      throw error;
    }
  }

  async getUserDetails(userId: string): Promise<AdminUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }

  // Lawyer Verification
  async getLawyerApplications(filters?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ applications: LawyerApplication[]; total: number; page: number; totalPages: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE_URL}/admin/lawyers/applications?${queryParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lawyer applications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lawyer applications:', error);
      throw error;
    }
  }

  async reviewLawyerApplication(
    applicationId: string, 
    action: 'approve' | 'reject', 
    notes?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/lawyers/applications/${applicationId}/review`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, notes })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} lawyer application`);
      }
    } catch (error) {
      console.error(`Error ${action} lawyer application:`, error);
      throw error;
    }
  }

  async getApplicationDetails(applicationId: string): Promise<LawyerApplication> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/lawyers/applications/${applicationId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch application details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching application details:', error);
      throw error;
    }
  }

  // Analytics
  async getAdminAnalytics(dateRange: string = '30d'): Promise<AdminAnalytics> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics?dateRange=${dateRange}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      throw error;
    }
  }

  async getUserBehaviorAnalytics(dateRange: string = '30d'): Promise<UserBehaviorAnalytics> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/behavior?dateRange=${dateRange}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user behavior analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user behavior analytics:', error);
      throw error;
    }
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  }

  async updateSystemSettings(settings: SystemSettings): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update system settings');
      }
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  async exportSettings(): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings/export`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to export settings');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  async importSettings(file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('settings', file);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/admin/settings/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to import settings');
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  // Activity Logs
  async getActivityLogs(filters?: {
    userId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: Array<{
      id: string;
      userId: string;
      action: string;
      details: Record<string, unknown>;
      timestamp: string;
      ipAddress: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.userId) queryParams.append('userId', filters.userId);
      if (filters?.action) queryParams.append('action', filters.action);
      if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE_URL}/admin/activity?${queryParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  // System Health
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    database: { status: string; responseTime: number };
    memory: { used: number; total: number; percentage: number };
    cpu: { usage: number };
    diskSpace: { used: number; total: number; percentage: number };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/health`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  // Data Export
  async exportData(type: 'users' | 'lawyers' | 'transactions' | 'all', format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/export/${type}?format=${format}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to export ${type} data`);
      }

      return await response.blob();
    } catch (error) {
      console.error(`Error exporting ${type} data:`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const adminService = new AdminService();