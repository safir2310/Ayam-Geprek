/**
 * WhatsApp Gateway Mock Implementations
 * These are mock implementations for Fonnte, Wablas, and Twilio
 * In production, replace with actual API calls to these services
 */

export type WhatsAppGateway = 'fonnte' | 'wablas' | 'twilio';

export interface GatewayConfig {
  apiKey?: string;
  senderNumber?: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Fonnte Gateway Mock Implementation
export class FonnteGateway {
  private config: GatewayConfig;

  constructor(config: GatewayConfig = {}) {
    this.config = config;
  }

  async send(to: string, message: string): Promise<SendMessageResult> {
    // Mock implementation - in production, call actual Fonnte API
    // API: https://api.fonnte.com/send

    console.log(`[Fonnte Mock] Sending to ${to}:`, message);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock success response
    if (to.startsWith('62') || to.startsWith('08')) {
      return {
        success: true,
        messageId: `FONNTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    return {
      success: false,
      error: 'Invalid phone number format. Must start with 62 or 08',
    };
  }
}

// Wablas Gateway Mock Implementation
export class WablasGateway {
  private config: GatewayConfig;

  constructor(config: GatewayConfig = {}) {
    this.config = config;
  }

  async send(to: string, message: string): Promise<SendMessageResult> {
    // Mock implementation - in production, call actual Wablas API
    // API: https://solo.wablas.com/api/send-message

    console.log(`[Wablas Mock] Sending to ${to}:`, message);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Mock success response
    if (to.startsWith('62') || to.startsWith('08')) {
      return {
        success: true,
        messageId: `WABLAS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    return {
      success: false,
      error: 'Invalid phone number format',
    };
  }
}

// Twilio Gateway Mock Implementation
export class TwilioGateway {
  private config: GatewayConfig;

  constructor(config: GatewayConfig = {}) {
    this.config = config;
  }

  async send(to: string, message: string): Promise<SendMessageResult> {
    // Mock implementation - in production, call actual Twilio API
    // API: https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json

    console.log(`[Twilio Mock] Sending to ${to}:`, message);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 700));

    // Mock success response
    if (to.startsWith('62') || to.startsWith('+62')) {
      return {
        success: true,
        messageId: `TWILIO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    return {
      success: false,
      error: 'Invalid phone number format. Must start with +62',
    };
  }
}

// Gateway Factory
export function createGateway(type: WhatsAppGateway, config: GatewayConfig = {}) {
  switch (type) {
    case 'fonnte':
      return new FonnteGateway(config);
    case 'wablas':
      return new WablasGateway(config);
    case 'twilio':
      return new TwilioGateway(config);
    default:
      throw new Error(`Unknown gateway type: ${type}`);
  }
}

// Send message using specified gateway
export async function sendWhatsAppMessage(
  gatewayType: WhatsAppGateway,
  to: string,
  message: string,
  config?: GatewayConfig
): Promise<SendMessageResult> {
  try {
    const gateway = createGateway(gatewayType, config);
    return await gateway.send(to, message);
  } catch (error) {
    console.error(`Error sending message via ${gatewayType}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Environment-based gateway selection
export function getDefaultGateway(): WhatsAppGateway {
  const gateway = process.env.WHATSAPP_GATEWAY?.toLowerCase() as WhatsAppGateway;
  if (gateway === 'fonnte' || gateway === 'wablas' || gateway === 'twilio') {
    return gateway;
  }
  // Default to fonnte
  return 'fonnte';
}

// Get gateway configuration from environment
export function getGatewayConfig(type: WhatsAppGateway): GatewayConfig {
  const config: GatewayConfig = {};

  switch (type) {
    case 'fonnte':
      config.apiKey = process.env.FONNTE_API_KEY;
      config.senderNumber = process.env.FONNTE_SENDER_NUMBER;
      break;
    case 'wablas':
      config.apiKey = process.env.WABLAS_API_KEY;
      config.senderNumber = process.env.WABLAS_SENDER_NUMBER;
      break;
    case 'twilio':
      config.apiKey = process.env.TWILIO_ACCOUNT_SID;
      config.senderNumber = process.env.TWILIO_PHONE_NUMBER;
      break;
  }

  return config;
}
