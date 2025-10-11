import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response.data?.message?.toLowerCase();
      const isInvalidToken = errorMessage?.includes('invalid token') || errorMessage?.includes('token expired');

      if (isInvalidToken) {
        // Check if we're already on the login page to avoid redirect loops
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          console.log('🔒 Session expired or unauthorized - redirecting to login');
          
          // Clear auth data from storage
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-user');

          // Redirect to login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
