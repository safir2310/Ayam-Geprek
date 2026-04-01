import { BaseGateway } from './base-gateway.js';
import { PaymentGateway, GatewayCallbackPayload, PaymentStatus } from '../types/index.js';
import crypto from 'crypto';

export class TripayGateway extends BaseGateway {
  name = PaymentGateway.TRIPAY;

  constructor(private apiKey: string, private privateKey: string, private merchantCode: string) {
    super();
  }

  verifyCallback(payload: GatewayCallbackPayload): boolean {
    if (!payload.signature) {
      return false;
    }

    // Tripay signature verification
    // signature = md5(merchantCode + amount + merchantRef + privateKey)
    const merchantRef = payload.metadata?.merchant_ref || payload.transactionId;
    const signatureString = `${this.merchantCode}${this.formatAmount(payload.amount)}${merchantRef}${this.privateKey}`;
    const expectedSignature = this.md5(signatureString);

    return payload.signature === expectedSignature;
  }

  private md5(message: string): string {
    return crypto.createHash('md5').update(message).digest('hex');
  }
}
