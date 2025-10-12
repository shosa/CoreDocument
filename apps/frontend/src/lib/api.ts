import axios from 'axios';

// In produzione con nginx, usa il path relativo /api
// In sviluppo locale senza nginx, usa http://localhost:3002/api
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Documents API
export const documentsApi = {
  list: (params?: any) => api.get('/documents', { params }),
  get: (id: string) => api.get(`/documents/${id}`),
  create: (data: FormData) => api.post('/documents', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  bulkUpload: (data: FormData) => api.post('/documents/bulk-upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: any) => api.patch(`/documents/${id}`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
  download: (id: string) => api.get(`/documents/${id}/download`, {
    responseType: 'blob'
  }),
  getDownloadUrl: (id: string) => api.get(`/documents/${id}/download-url`),
  search: (query: string) => api.get('/search', { params: { query } }),
};

// Favorites API
export const favoritesApi = {
  list: (params?: any) => api.get('/favorites', { params }),
  add: (documentId: string) => api.post('/favorites', { documentId }),
  remove: (documentId: string) => api.delete(`/favorites/${documentId}`),
  toggle: (documentId: string) => api.post(`/favorites/${documentId}/toggle`),
  check: (documentId: string) => api.get(`/favorites/${documentId}/check`),
};

// Search API
export const searchApi = {
  search: (params: any) => api.get('/search', { params }),
};
