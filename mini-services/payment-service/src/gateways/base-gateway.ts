import {
  IPaymentGateway,
  PaymentGateway,
  CreatePaymentRequest,
  CreatePaymentResponse,
  GatewayCallbackPayload,
  PaymentStatus
} from '../types/index.js';
import QRCode from 'qrcode';
import { randomUUID } from 'crypto';

export abstract class BaseGateway implements IPaymentGateway {
  abstract name: PaymentGateway;

  protected generateTransactionId(orderId: string): string {
    return `${this.name.toLowerCase()}-${orderId}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  }

  protected generateQRString(transactionId: string, amount: number): string {
    // Format amount to IDR format without decimals
    const formattedAmount = this.formatAmount(amount);
    return `${this.name}|${transactionId}|${formattedAmount}`;
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    // Validate amount
    if (!this.validateAmount(request.amount)) {
      throw new Error('Invalid amount');
    }

    // Generate transaction ID
    const transactionId = this.generateTransactionId(request.orderId);

    // Calculate expiry date
    const expiryMinutes = request.expiryMinutes || 15; // Default 15 minutes
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + expiryMinutes);

    // Generate QR string
    const qrString = this.generateQRString(transactionId, request.amount);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    return {
      success: true,
      transactionId,
      qrCode,
      qrString,
      expiryDate: expiryDate.toISOString(),
      amount: request.amount,
      status: PaymentStatus.PENDING
    };
  }

  abstract verifyCallback(payload: GatewayCallbackPayload): boolean;

  formatAmount(amount: number): number {
    // Round to nearest integer for IDR
    return Math.round(amount);
  }

  validateAmount(amount: number): boolean {
    // Amount must be positive and at least 1000 IDR
    return amount > 0 && amount >= 1000;
  }
}
