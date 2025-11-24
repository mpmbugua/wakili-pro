import axios, { AxiosResponse } from 'axios';
import { LoginRequest, RegisterRequest, AuthUser } from '../../../shared/src/types/auth';
import { ApiResponse } from '../../../shared/src/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wakili-pro.onrender.com/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth service interface
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthData {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private accessToken: string | null = null;

  constructor() {
    // Set up request interceptor to add auth token
    apiClient.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Set up response interceptor for automatic token refresh
    apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              if (response.success && response.data) {
                this.setAccessToken(response.data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return apiClient(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  private getRefreshToken(): string | null {
    const authData = localStorage.getItem('wakili-auth-storage');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.state?.refreshToken || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private clearTokens(): void {
    this.accessToken = null;
    localStorage.removeItem('wakili-auth-storage');
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthData>> {
    try {
      console.log('[AuthService] Attempting login to:', `${API_BASE_URL}/auth/login`);
      console.log('[AuthService] Credentials:', { email: credentials.email, password: '***' });
      
      const response: AxiosResponse<ApiResponse<AuthData>> = await apiClient.post(
        '/auth/login',
        credentials
      );

      console.log('[AuthService] Login response:', response.data);

      if (response.data.success && response.data.data) {
        this.setAccessToken(response.data.data.accessToken);
      }

      return response.data;
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[AuthService] Error response:', error.response.data);
        return error.response.data;
      }
      
      return {
        success: false,
        message: 'Network error occurred during login'
      };
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthData>> {
    try {
      const response: AxiosResponse<ApiResponse<AuthData>> = await apiClient.post(
        '/auth/register',
        userData
      );

      if (response.data.success && response.data.data) {
        this.setAccessToken(response.data.data.accessToken);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: 'Network error occurred during registration'
      };
    }
  }

  async logout(refreshToken: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await apiClient.post(
        '/auth/logout',
        { refreshToken }
      );

      this.clearTokens();
      return response.data;
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      this.clearTokens();
      
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: 'Network error occurred during logout'
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    try {
      const response: AxiosResponse<ApiResponse<AuthTokens>> = await apiClient.post(
        '/auth/refresh',
        { refreshToken }
      );

      if (response.data.success && response.data.data) {
        this.setAccessToken(response.data.data.accessToken);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: 'Network error occurred during token refresh'
      };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await apiClient.post(
        '/auth/change-password',
        { currentPassword, newPassword }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: 'Network error occurred during password change'
      };
    }
  }
}

export const authService = new AuthService();