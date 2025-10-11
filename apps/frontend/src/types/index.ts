// User types
export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Document types
export interface Document {
  id: number;
  supplier: string;
  docNumber: string;
  date: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedById: number;
  isFavorite?: boolean;
  uploadedAt: string;
  uploadedBy?: User;
  createdAt?: string;
  updatedAt?: string;
}

// API Response types
export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface DocumentFormData {
  supplier: string;
  docNumber: string;
  date: string;
  file: File;
}

export interface DocumentUploadData {
  supplier: string;
  docNumber: string;
  date: string;
}

// Stats types
export interface DashboardStats {
  totalDocuments: number;
  totalUsers: number;
  documentsThisMonth: number;
  documentsThisYear: number;
}

// Search types
export interface SearchFilters {
  supplier?: string;
  docNumber?: string;
  date?: string;
  month?: number;
  year?: number;
  q?: string;
}
