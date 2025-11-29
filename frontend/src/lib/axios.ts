import axios from 'axios';

// Use environment variable for API URL in production
const baseURL = import.meta.env.VITE_API_URL || 'https://wakili-pro.onrender.com/api';

console.log('🔧 Axios Configuration:');
console.log('   VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('   Base URL:', baseURL);
console.log('   Mode:', import.meta.env.MODE);

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
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    console.log('   Full URL:', config.baseURL + config.url);
    
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
      // Don't redirect on logout or refresh endpoints
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/logout') || url.includes('/refresh');
      
      if (!isAuthEndpoint) {
        console.log('401 error on non-auth endpoint, clearing storage');
        // Clear auth storage
        localStorage.removeItem('wakili-auth-storage');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to home page on unauthorized
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { axiosInstance };
