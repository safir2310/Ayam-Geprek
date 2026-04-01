import { IPaymentGateway, PaymentGateway } from '../types/index.js';
import { MidtransGateway } from './midtrans-gateway.js';
import { XenditGateway } from './xendit-gateway.js';
import { TripayGateway } from './tripay-gateway.js';

export class GatewayFactory {
  private static gateways: Map<PaymentGateway, IPaymentGateway> = new Map();

  static initialize() {
    // Initialize Midtrans (replace with actual credentials from env)
    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-xxxx';
    const midtransClientKey = process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxxx';
    this.gateways.set(PaymentGateway.MIDTRANS, new MidtransGateway(midtransServerKey, midtransClientKey));

    // Initialize Xendit
    const xenditApiKey = process.env.XENDIT_API_KEY || 'xnd_development_xxx';
    this.gateways.set(PaymentGateway.XENDIT, new XenditGateway(xenditApiKey));

    // Initialize Tripay
    const tripayApiKey = process.env.TRIPAY_API_KEY || 'data-api-key';
    const tripayPrivateKey = process.env.TRIPAY_PRIVATE_KEY || 'private-key';
    const tripayMerchantCode = process.env.TRIPAY_MERCHANT_CODE || 'merchant-code';
    this.gateways.set(
      PaymentGateway.TRIPAY,
      new TripayGateway(tripayApiKey, tripayPrivateKey, tripayMerchantCode)
    );
  }

  static getGateway(gateway: PaymentGateway): IPaymentGateway {
    if (this.gateways.size === 0) {
      this.initialize();
    }

    const gatewayInstance = this.gateways.get(gateway);
    if (!gatewayInstance) {
      throw new Error(`Gateway ${gateway} not found`);
    }

    return gatewayInstance;
  }

  static getAllGateways(): IPaymentGateway[] {
    if (this.gateways.size === 0) {
      this.initialize();
    }

    return Array.from(this.gateways.values());
  }
}
