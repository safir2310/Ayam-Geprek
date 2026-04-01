import { z } from 'zod';
import { PaymentGateway, PaymentStatus } from '../types/index.js';

// Create payment request schema
export const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be positive').min(1000, 'Amount must be at least 1000'),
  gateway: z.nativeEnum(PaymentGateway, {
    errorMap: () => ({ message: 'Invalid gateway. Must be MIDTRANS, XENDIT, or TRIPAY' })
  }),
  customerEmail: z.string().email('Invalid email').optional(),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  expiryMinutes: z.number().int().positive().min(1).max(1440).optional(), // 1 min to 24 hours
  metadata: z.record(z.any()).optional()
});

// Callback payload schema
export const callbackSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  status: z.nativeEnum(PaymentStatus, {
    errorMap: () => ({ message: 'Invalid payment status' })
  }),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.string().optional(),
  paymentDate: z.string().datetime().optional(),
  signature: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Transaction ID parameter schema
export const transactionIdSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required')
});

// Validation utilities
export class PaymentValidator {
  static validateCreatePayment(data: unknown) {
    return createPaymentSchema.parse(data);
  }

  static validateCallback(data: unknown) {
    return callbackSchema.parse(data);
  }

  static validateTransactionId(data: unknown) {
    return transactionIdSchema.parse(data);
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    return phoneRegex.test(phone) && phone.replace(/[^0-9]/g, '').length >= 10;
  }

  static isValidAmount(amount: number): boolean {
    return amount > 0 && amount >= 1000;
  }

  static isValidGateway(gateway: string): boolean {
    return Object.values(PaymentGateway).includes(gateway as PaymentGateway);
  }

  static isValidStatus(status: string): boolean {
    return Object.values(PaymentStatus).includes(status as PaymentStatus);
  }
}
