// Payment status enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Payment gateway enum
export enum PaymentGateway {
  MIDTRANS = 'MIDTRANS',
  XENDIT = 'XENDIT',
  TRIPAY = 'TRIPAY'
}

// Payment transaction interface
export interface PaymentTransaction {
  id: string;
  transactionId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  gateway: PaymentGateway;
  qrCode?: string;
  qrString?: string;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

// Create payment request
export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  gateway: PaymentGateway;
  customerEmail?: string;
  customerPhone?: string;
  expiryMinutes?: number;
  metadata?: Record<string, any>;
}

// Create payment response
export interface CreatePaymentResponse {
  success: boolean;
  transactionId: string;
  qrCode: string;
  qrString: string;
  expiryDate: string;
  amount: number;
  status: PaymentStatus;
}

// Payment status response
export interface PaymentStatusResponse {
  success: boolean;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  createdAt: string;
  updatedAt: string;
  expiryDate: string;
}

// Gateway callback payload
export interface GatewayCallbackPayload {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  paymentMethod?: string;
  paymentDate?: Date;
  metadata?: Record<string, any>;
  signature?: string;
}

// Gateway interface
export interface IPaymentGateway {
  name: PaymentGateway;
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  verifyCallback(payload: GatewayCallbackPayload): boolean;
  formatAmount(amount: number): number;
  validateAmount(amount: number): boolean;
}

// Logger interface
export interface ILogger {
  info(message: string, data?: any): void;
  error(message: string, error?: any): void;
  warn(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}
