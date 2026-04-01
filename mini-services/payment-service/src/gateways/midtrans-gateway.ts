import { BaseGateway } from './base-gateway.js';
import { PaymentGateway, GatewayCallbackPayload, PaymentStatus } from '../types/index.js';
import crypto from 'crypto';

export class MidtransGateway extends BaseGateway {
  name = PaymentGateway.MIDTRANS;

  constructor(private serverKey: string, private clientKey: string) {
    super();
  }

  verifyCallback(payload: GatewayCallbackPayload): boolean {
    if (!payload.signature) {
      return false;
    }

    // Midtrans signature verification
    // signature = SHA512(order_id + status_code + gross_amount + serverKey)
    const signatureString = `${payload.transactionId}${this.getStatusCode(payload.status)}${this.formatAmount(payload.amount)}${this.serverKey}`;
    const expectedSignature = this.sha512(signatureString);

    return payload.signature === expectedSignature;
  }

  private getStatusCode(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID:
        return '200';
      case PaymentStatus.FAILED:
        return '202';
      case PaymentStatus.EXPIRED:
        return '407';
      default:
        return '201';
    }
  }

  private sha512(message: string): string {
    // Simple SHA512 implementation
    // In production, use crypto.createHash('sha512')
    return crypto.createHash('sha512').update(message).digest('hex');
  }
}
