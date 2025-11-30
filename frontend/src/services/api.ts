import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from Zustand persist storage (same as axiosInstance)
    const authStorage = localStorage.getItem('wakili-auth-storage');
    
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed.state?.accessToken;
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    
    // Fallback to old token location if exists
    const legacyToken = localStorage.getItem('token');
    if (legacyToken && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${legacyToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on wallet/profile API errors - they might just not exist yet
      const url = error.config?.url || '';
      const skipRedirectUrls = ['/wallet/', '/lawyers/profile', '/users/profile'];
      const shouldSkipRedirect = skipRedirectUrls.some(path => url.includes(path));
      
      if (!shouldSkipRedirect) {
        // Token expired or invalid - clear all auth storage
        localStorage.removeItem('wakili-auth-storage');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;