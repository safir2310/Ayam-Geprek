// Auth type definitions

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF';
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyPinRequest {
  supervisorEmail: string;
  pin: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  token?: string;
  error?: string;
}

export interface VerifyPinResponse {
  success: boolean;
  message?: string;
  supervisor?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
}
