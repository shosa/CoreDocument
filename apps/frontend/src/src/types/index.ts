// User types
export type UserRole = 'admin' | 'tecnico' | 'utente';

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

// Category types
export interface Category {
  id: number;
  name: string;
  description?: string;
  types?: Type[];
  createdAt?: string;
  updatedAt?: string;
}

// Type types
export interface Type {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
  category?: Category;
  machines?: Machine[];
  createdAt?: string;
  updatedAt?: string;
}

// Machine types
export interface Machine {
  id: number;
  typeId: number;
  serialNumber: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  yearBuilt?: number;
  purchaseDate?: string;
  dealer?: string;
  invoiceReference?: string;
  documentLocation?: string;
  type?: Type;
  documents?: Document[];
  maintenances?: Maintenance[];
  scheduledMaintenances?: ScheduledMaintenance[];
  createdAt?: string;
  updatedAt?: string;
}

// Document types
export type DocumentCategory =
  | 'manuale_uso'
  | 'certificazione_ce'
  | 'scheda_tecnica'
  | 'fattura_acquisto'
  | 'altro';

export interface Document {
  id: number;
  machineId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  documentCategory: DocumentCategory;
  uploadedById: number;
  uploadedAt: string;
  machine?: Machine;
  uploadedBy?: User;
}

// Maintenance types
export type MaintenanceType =
  | 'ordinaria'
  | 'straordinaria'
  | 'guasto'
  | 'riparazione';

export interface Maintenance {
  id: number;
  machineId: number;
  operatorId: number;
  date: string;
  type: MaintenanceType;
  problemDescription?: string;
  workPerformed: string;
  spareParts?: string;
  cost?: number;
  machine?: Machine;
  operator?: User;
  createdAt?: string;
  updatedAt?: string;
}

// Scheduled Maintenance types
export type MaintenanceFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'annual';

export interface ScheduledMaintenance {
  id: number;
  machineId: number;
  title: string;
  description?: string;
  frequency: MaintenanceFrequency;
  nextDueDate: string;
  notificationDaysBefore: number;
  isActive: boolean;
  createdById: number;
  machine?: Machine;
  createdBy?: User;
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

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface UserFormData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

export interface TypeFormData {
  categoryId: number;
  name: string;
  description?: string;
}

export interface MachineFormData {
  typeId: number;
  serialNumber: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  yearBuilt?: number;
  purchaseDate?: string;
  dealer?: string;
  invoiceReference?: string;
  documentLocation?: string;
}

export interface MaintenanceFormData {
  machineId: number;
  operatorId: number;
  date: string;
  type: MaintenanceType;
  problemDescription?: string;
  workPerformed: string;
  spareParts?: string;
  cost?: number;
}

export interface ScheduledMaintenanceFormData {
  machineId: number;
  title: string;
  description?: string;
  frequency: MaintenanceFrequency;
  nextDueDate: string;
  notificationDaysBefore: number;
  isActive: boolean;
}

export interface DocumentFormData {
  machineId: number;
  documentCategory: DocumentCategory;
  file: File;
}

// Stats types
export interface DashboardStats {
  totalMachines: number;
  totalMaintenances: number;
  pendingMaintenances: number;
  totalDocuments: number;
  totalUsers: number;
}
