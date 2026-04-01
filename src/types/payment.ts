// Payment Gateway Types
export type PaymentGateway = 'midtrans' | 'xendit' | 'tripay';

// Payment Status Types
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED';

// QRIS Payment Request
export interface CreateQRISPaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  gateway: PaymentGateway;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  expiryMinutes?: number;
  metadata?: Record<string, any>;
}

// QRIS Payment Response
export interface CreateQRISPaymentResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  gateway: PaymentGateway;
  qrCode: string;
  qrString: string;
  expiryTime: Date;
  paymentUrl?: string;
  createdAt: Date;
}

// Payment Status Response
export interface PaymentStatusResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  paidAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: Date;
  expiryTime: Date;
  gateway: PaymentGateway;
  metadata?: Record<string, any>;
}

// Callback Request Structure
export interface PaymentCallbackRequest {
  gateway: PaymentGateway;
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  transactionId?: string;
  paidAmount?: number;
  paymentMethod?: string;
  signature?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

// Expire Payment Request
export interface ExpirePaymentRequest {
  paymentId: string;
  reason?: string;
}

// Payment Gateway Configuration
export interface GatewayConfig {
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  sandbox?: boolean;
}

// QRIS Response from Gateway (Mock)
export interface GatewayQRISResponse {
  success: boolean;
  qrCode: string;
  qrString: string;
  paymentUrl?: string;
  transactionId: string;
  expiryTime: Date;
}
