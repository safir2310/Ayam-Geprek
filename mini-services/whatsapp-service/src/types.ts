export interface WhatsAppMessage {
  to: string;
  message: string;
  template?: string;
  data?: Record<string, any>;
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  gateway?: string;
}

export interface OrderData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentMethod?: string;
  orderType?: 'dine_in' | 'take_away' | 'delivery';
  estimatedTime?: number;
}

export interface PaymentData {
  orderId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  customerName: string;
  customerPhone: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'ready';

export interface QueuedMessage extends WhatsAppMessage {
  id: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  createdAt: number;
  priority: 'high' | 'medium' | 'low';
}

export interface GatewayConfig {
  fonnte?: {
    token: string;
    apiUrl: string;
  };
  wablas?: {
    token: string;
    domain: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    whatsappNumber: string;
  };
}

export interface WhatsAppGateway {
  name: string;
  send(message: WhatsAppMessage): Promise<MessageResponse>;
  checkStatus(messageId: string): Promise<{ status: string; delivered?: boolean }>;
}
