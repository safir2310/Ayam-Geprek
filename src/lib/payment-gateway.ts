import {
  PaymentGateway,
  GatewayConfig,
  GatewayQRISResponse,
  PaymentStatus,
} from '@/types/payment';
import QRCode from 'qrcode';

/**
 * Payment Gateway Service
 * Mock implementation for Midtrans, Xendit, and Tripay
 */
class PaymentGatewayService {
  // Mock configurations (in production, these would come from environment variables)
  private configs: Record<PaymentGateway, GatewayConfig> = {
    midtrans: {
      enabled: true,
      apiKey: process.env.MIDTRANS_API_KEY || 'mock-midtrans-key',
      apiSecret: process.env.MIDTRANS_API_SECRET || 'mock-midtrans-secret',
      merchantId: process.env.MIDTRANS_MERCHANT_ID || 'mock-merchant-id',
      sandbox: true,
    },
    xendit: {
      enabled: true,
      apiKey: process.env.XENDIT_API_KEY || 'mock-xendit-key',
      apiSecret: process.env.XENDIT_API_SECRET || 'mock-xendit-secret',
      sandbox: true,
    },
    tripay: {
      enabled: true,
      apiKey: process.env.TRIPAY_API_KEY || 'mock-tripay-key',
      apiSecret: process.env.TRIPAY_API_SECRET || 'mock-tripay-secret',
      merchantId: process.env.TRIPAY_MERCHANT_ID || 'mock-tripay-id',
      sandbox: true,
    },
  };

  /**
   * Create QRIS Payment with specified gateway
   */
  async createQRISPayment(
    gateway: PaymentGateway,
    orderData: {
      orderId: string;
      amount: number;
      customerName: string;
      customerEmail?: string;
      customerPhone?: string;
      items?: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
      }>;
      expiryMinutes?: number;
    }
  ): Promise<GatewayQRISResponse> {
    const config = this.configs[gateway];

    if (!config || !config.enabled) {
      throw new Error(`Payment gateway ${gateway} is not enabled`);
    }

    // Mock implementation - in production, this would call the actual gateway APIs
    const transactionId = this.generateTransactionId(gateway);
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + (orderData.expiryMinutes || 30));

    // Generate mock QR code and QR string
    const qrCode = await this.generateMockQRCode(transactionId, orderData.amount);
    const qrString = this.generateMockQRString(transactionId, orderData.amount);

    // Log the payment creation
    console.log(`[PaymentGateway] Creating QRIS payment via ${gateway}`);
    console.log(`[PaymentGateway] Order: ${orderData.orderId}, Amount: ${orderData.amount}`);

    return {
      success: true,
      qrCode,
      qrString,
      paymentUrl: `https://${gateway}.com/payment/${transactionId}`,
      transactionId,
      expiryTime,
    };
  }

  /**
   * Get payment status from gateway
   */
  async getPaymentStatus(
    gateway: PaymentGateway,
    transactionId: string
  ): Promise<{
    status: PaymentStatus;
    paidAmount?: number;
    paymentMethod?: string;
    paidAt?: Date;
  }> {
    console.log(`[PaymentGateway] Checking payment status for ${transactionId} via ${gateway}`);

    // Mock implementation - in production, this would call the gateway API
    // For now, return pending status
    return {
      status: 'PENDING',
    };
  }

  /**
   * Expire payment at gateway
   */
  async expirePayment(
    gateway: PaymentGateway,
    transactionId: string
  ): Promise<boolean> {
    console.log(`[PaymentGateway] Expiring payment ${transactionId} via ${gateway}`);

    // Mock implementation - always success
    return true;
  }

  /**
   * Verify callback signature
   */
  verifyCallbackSignature(
    gateway: PaymentGateway,
    signature: string,
    payload: any
  ): boolean {
    // Mock implementation - in production, this would verify the actual signature
    console.log(`[PaymentGateway] Verifying callback signature from ${gateway}`);
    return true;
  }

  /**
   * Generate transaction ID based on gateway format
   */
  private generateTransactionId(gateway: PaymentGateway): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    switch (gateway) {
      case 'midtrans':
        return `ORD-${timestamp}-${random}`.toUpperCase();
      case 'xendit':
        return `txn_${timestamp}_${random}`;
      case 'tripay':
        return `TRIPAY${timestamp}${random}`.toUpperCase();
      default:
        return `${gateway.toUpperCase()}-${timestamp}-${random}`;
    }
  }

  /**
   * Generate QR code (base64 PNG)
   */
  private async generateMockQRCode(transactionId: string, amount: number): Promise<string> {
    try {
      // Create QR code data string with transaction info
      const qrData = `QRIS|${transactionId}|${amount}|AYAM_GEPREK_SAMBAL_IJO`;

      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('[PaymentGateway] Failed to generate QR code:', error);
      // Fallback to simple base64 string if QR generation fails
      const qrData = JSON.stringify({ transactionId, amount });
      const encoded = Buffer.from(qrData).toString('base64');
      return `data:image/png;base64,${encoded}`;
    }
  }

  /**
   * Generate mock QR string
   */
  private generateMockQRString(transactionId: string, amount: number): string {
    // Mock QRIS format string
    return `00020101021226580016ID.CO.QRIS.WWW01189360052002000000000303UMI51440014ID.CO.QRIS.WWW0215ID10200200000000303UMI5204581253033605802ID5910AYAM GEPREK6007Jakarta6105101016304`;
  }

  /**
   * Get gateway configuration
   */
  getGatewayConfig(gateway: PaymentGateway): GatewayConfig {
    return this.configs[gateway];
  }

  /**
   * Check if gateway is enabled
   */
  isGatewayEnabled(gateway: PaymentGateway): boolean {
    return this.configs[gateway]?.enabled || false;
  }

  /**
   * Get all enabled gateways
   */
  getEnabledGateways(): PaymentGateway[] {
    return Object.entries(this.configs)
      .filter(([_, config]) => config.enabled)
      .map(([gateway]) => gateway as PaymentGateway);
  }
}

// Export singleton instance
export const paymentGatewayService = new PaymentGatewayService();
