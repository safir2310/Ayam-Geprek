import { BaseGateway } from './base-gateway.js';
import { PaymentGateway, GatewayCallbackPayload, PaymentStatus } from '../types/index.js';
import crypto from 'crypto';

export class XenditGateway extends BaseGateway {
  name = PaymentGateway.XENDIT;

  constructor(private apiKey: string) {
    super();
  }

  verifyCallback(payload: GatewayCallbackPayload): boolean {
    if (!payload.signature) {
      return false;
    }

    // Xendit signature verification using HMAC SHA256
    // signature = HMAC_SHA256(apiKey + callback_token)
    const callbackToken = payload.metadata?.callback_token || '';
    const signatureString = `${this.apiKey}${callbackToken}`;
    const expectedSignature = this.hmacSha256(signatureString, this.apiKey);

    return payload.signature === expectedSignature;
  }

  private hmacSha256(message: string, key: string): string {
    return crypto
      .createHmac('sha256', key)
      .update(message)
      .digest('hex');
  }
}
