import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '../../../shared/src/types';

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

type CreateServiceData = any;
type CreateBookingData = any;
type CreateReviewData = any;

interface MarketplaceService {
  id: string;
  type: string;
  title: string;
  description: string;
  priceKES: number;
  duration?: number;
  deliveryTimeframe?: string;
  tags?: string[];
  providerId: string;
  provider: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
    lawyerProfile: {
      rating: number;
      reviewCount: number;
      specializations: string[];
      location: {
        city: string;
        county: string;
        country: string;
      };
      isVerified: boolean;
    };
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceBooking {
  id: string;
  serviceId: string;
  clientId: string;
  providerId: string;
  status: string;
  scheduledAt?: string;
  clientRequirements: string;
  providerNotes?: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceReview {
  id: string;
  serviceId: string;
  clientId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

class MarketplaceServiceClass {
  async createService(data: CreateServiceData): Promise<ApiResponse<MarketplaceService>> {
    try {
      const response: AxiosResponse<ApiResponse<MarketplaceService>> = await apiClient.post(
        '/marketplace/services',
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while creating service'
      };
    }
  }

  async getMyServices(): Promise<ApiResponse<MarketplaceService[]>> {
    try {
      const response: AxiosResponse<ApiResponse<MarketplaceService[]>> = await apiClient.get(
        '/marketplace/my-services'
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while fetching services'
      };
    }
  }

  async updateService(serviceId: string, data: Partial<CreateServiceData>): Promise<ApiResponse<MarketplaceService>> {
    try {
      const response: AxiosResponse<ApiResponse<MarketplaceService>> = await apiClient.put(
        `/marketplace/services/${serviceId}`,
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while updating service'
      };
    }
  }

  async deleteService(serviceId: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await apiClient.delete(
        `/marketplace/services/${serviceId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while deleting service'
      };
    }
  }

  async searchServices(params: {
    query?: string;
    type?: string;
    location?: { latitude: number; longitude: number; radius: number };
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    services: MarketplaceService[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    try {
      const response = await apiClient.get('/marketplace/services/search', { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while searching services'
      };
    }
  }

  async getService(serviceId: string): Promise<ApiResponse<MarketplaceService>> {
    try {
      const response: AxiosResponse<ApiResponse<MarketplaceService>> = await apiClient.get(
        `/marketplace/services/${serviceId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while fetching service'
      };
    }
  }

  async bookService(data: CreateBookingData): Promise<ApiResponse<ServiceBooking>> {
    try {
      const response: AxiosResponse<ApiResponse<ServiceBooking>> = await apiClient.post(
        '/marketplace/bookings',
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while booking service'
      };
    }
  }

  async getMyBookings(): Promise<ApiResponse<ServiceBooking[]>> {
    try {
      const response: AxiosResponse<ApiResponse<ServiceBooking[]>> = await apiClient.get(
        '/marketplace/my-bookings'
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while fetching bookings'
      };
    }
  }

  async updateBookingStatus(bookingId: string, status: string, providerNotes?: string): Promise<ApiResponse<ServiceBooking>> {
    try {
      const response: AxiosResponse<ApiResponse<ServiceBooking>> = await apiClient.put(
        `/marketplace/bookings/${bookingId}/status`,
        { status, providerNotes }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while updating booking status'
      };
    }
  }

  async createReview(data: CreateReviewData): Promise<ApiResponse<ServiceReview>> {
    try {
      const response: AxiosResponse<ApiResponse<ServiceReview>> = await apiClient.post(
        '/marketplace/reviews',
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while creating review'
      };
    }
  }

  async getServiceReviews(serviceId: string): Promise<ApiResponse<ServiceReview[]>> {
    try {
      const response: AxiosResponse<ApiResponse<ServiceReview[]>> = await apiClient.get(
        `/marketplace/services/${serviceId}/reviews`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while fetching reviews'
      };
    }
  }
}

export const marketplaceService = new MarketplaceServiceClass();