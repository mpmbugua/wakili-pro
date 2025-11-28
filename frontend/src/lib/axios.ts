import axios from 'axios';

// Use environment variable for API URL in production
const baseURL = import.meta.env.VITE_API_URL || 'https://wakili-pro.onrender.com/api';

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage (zustand persist storage)
    const authStorage = localStorage.getItem('wakili-auth-storage');
    console.log('Auth storage:', authStorage ? 'Found' : 'Not found');
    
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed.state?.accessToken;
        console.log('Access token:', token ? `${token.substring(0, 20)}...` : 'Not found');
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Authorization header set');
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { axiosInstance };
