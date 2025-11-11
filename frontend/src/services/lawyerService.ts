import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '../../../shared/src/types';
import { LawyerOnboardingSchema } from '../../../shared/src/schemas/user';
import { z } from 'zod';

interface LawyerAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const authData = localStorage.getItem('wakili-auth-storage');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      const token = parsed.state?.accessToken;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return config;
});

type LawyerOnboardingData = z.infer<typeof LawyerOnboardingSchema>;

interface LawyerProfile {
  id: string;
  licenseNumber: string;
  yearOfAdmission: number;
  specializations: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    county: string;
  };
  bio: string;
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  profileImageUrl?: string;
  availability: LawyerAvailability[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePicture?: string;
  };
}

class LawyerService {
  async completeLawyerOnboarding(data: LawyerOnboardingData): Promise<ApiResponse<LawyerProfile>> {
    try {
      const response: AxiosResponse<ApiResponse<LawyerProfile>> = await apiClient.post(
        '/users/lawyer-onboarding',
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred during onboarding'
      };
    }
  }

  async getLawyerProfile(): Promise<ApiResponse<LawyerProfile>> {
    try {
      const response: AxiosResponse<ApiResponse<LawyerProfile>> = await apiClient.get(
        '/lawyers/profile'
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while fetching profile'
      };
    }
  }

  async updateLawyerProfile(data: Partial<LawyerOnboardingData>): Promise<ApiResponse<LawyerProfile>> {
    try {
      const response: AxiosResponse<ApiResponse<LawyerProfile>> = await apiClient.put(
        '/lawyers/profile',
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while updating profile'
      };
    }
  }

  async updateAvailability(availability: LawyerAvailability[]): Promise<ApiResponse<{ availability: LawyerAvailability[] }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ availability: LawyerAvailability[] }>> = await apiClient.put(
        '/lawyers/availability',
        { availability }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while updating availability'
      };
    }
  }

  async getPublicLawyerProfile(lawyerId: string): Promise<ApiResponse<LawyerProfile>> {
    try {
      const response: AxiosResponse<ApiResponse<LawyerProfile>> = await apiClient.get(
        `/lawyers/${lawyerId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while fetching lawyer profile'
      };
    }
  }

  async searchLawyers(params: {
    specialization?: string;
    location?: string;
    minRating?: number;
    maxDistance?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    lawyers: LawyerProfile[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    try {
      const response = await apiClient.get('/lawyers', { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while searching lawyers'
      };
    }
  }
}

export const lawyerService = new LawyerService();