import type { WhatsAppGateway, WhatsAppMessage, MessageResponse, GatewayConfig } from '../types.js';
import { logger } from '../logger.js';

// Fonnte Gateway
class FonnteGateway implements WhatsAppGateway {
  name = 'fonnte';
  private token: string;
  private apiUrl: string;

  constructor(config: { token: string; apiUrl: string }) {
    this.token = config.token;
    this.apiUrl = config.apiUrl;
  }

  async send(message: WhatsAppMessage): Promise<MessageResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: message.to,
          message: message.message,
        }),
      });

      const data = await response.json();

      if (data.status) {
        logger.logMessageSent(message.to, data.id || 'unknown', message.template);
        return {
          success: true,
          messageId: data.id || `fonnte_${Date.now()}`,
          gateway: this.name,
        };
      } else {
        logger.logMessageFailed(message.to, data.reason || 'Unknown error', message.template);
        return {
          success: false,
          error: data.reason || 'Failed to send message',
          gateway: this.name,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.logMessageFailed(message.to, errorMessage, message.template);
      return {
        success: false,
        error: errorMessage,
        gateway: this.name,
      };
    }
  }

  async checkStatus(messageId: string): Promise<{ status: string; delivered?: boolean }> {
    // Fonnte doesn't provide status checking in free tier
    return { status: 'unknown', delivered: undefined };
  }
}

// Wablas Gateway
class WablasGateway implements WhatsAppGateway {
  name = 'wablas';
  private token: string;
  private domain: string;

  constructor(config: { token: string; domain: string }) {
    this.token = config.token;
    this.domain = config.domain;
  }

  async send(message: WhatsAppMessage): Promise<MessageResponse> {
    try {
      const response = await fetch(`https://${this.domain}/api/send-message`, {
        method: 'POST',
        headers: {
          'Authorization': this.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: message.to,
          message: message.message,
        }),
      });

      const data = await response.json();

      if (data.status) {
        logger.logMessageSent(message.to, data.id || 'unknown', message.template);
        return {
          success: true,
          messageId: data.id || `wablas_${Date.now()}`,
          gateway: this.name,
        };
      } else {
        logger.logMessageFailed(message.to, data.message || 'Unknown error', message.template);
        return {
          success: false,
          error: data.message || 'Failed to send message',
          gateway: this.name,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.logMessageFailed(message.to, errorMessage, message.template);
      return {
        success: false,
        error: errorMessage,
        gateway: this.name,
      };
    }
  }

  async checkStatus(messageId: string): Promise<{ status: string; delivered?: boolean }> {
    try {
      const response = await fetch(`https://${this.domain}/api/message-status/${messageId}`, {
        headers: {
          'Authorization': this.token,
        },
      });

      const data = await response.json();
      return {
        status: data.status || 'unknown',
        delivered: data.delivered,
      };
    } catch (error) {
      return { status: 'error', delivered: false };
    }
  }
}

// Twilio Gateway
class TwilioGateway implements WhatsAppGateway {
  name = 'twilio';
  private accountSid: string;
  private authToken: string;
  private whatsappNumber: string;

  constructor(config: { accountSid: string; authToken: string; whatsappNumber: string }) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.whatsappNumber = config.whatsappNumber;
  }

  async send(message: WhatsAppMessage): Promise<MessageResponse> {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.whatsappNumber,
            To: message.to.startsWith('+') ? message.to : `+${message.to}`,
            Body: message.message,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        logger.logMessageSent(message.to, data.sid, message.template);
        return {
          success: true,
          messageId: data.sid,
          gateway: this.name,
        };
      } else {
        logger.logMessageFailed(message.to, data.message || 'Unknown error', message.template);
        return {
          success: false,
          error: data.message || 'Failed to send message',
          gateway: this.name,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.logMessageFailed(message.to, errorMessage, message.template);
      return {
        success: false,
        error: errorMessage,
        gateway: this.name,
      };
    }
  }

  async checkStatus(messageId: string): Promise<{ status: string; delivered?: boolean }> {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages/${messageId}.json`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
          },
        }
      );

      const data = await response.json();
      const status = data.status || 'unknown';

      return {
        status,
        delivered: status === 'delivered',
      };
    } catch (error) {
      return { status: 'error', delivered: false };
    }
  }
}

// Gateway Factory
export function createGateway(gatewayType: string, config: GatewayConfig): WhatsAppGateway {
  logger.logGatewayUsed(gatewayType);

  switch (gatewayType.toLowerCase()) {
    case 'fonnte':
      if (!config.fonnte) throw new Error('Fonnte configuration is missing');
      return new FonnteGateway(config.fonnte);

    case 'wablas':
      if (!config.wablas) throw new Error('Wablas configuration is missing');
      return new WablasGateway(config.wablas);

    case 'twilio':
      if (!config.twilio) throw new Error('Twilio configuration is missing');
      return new TwilioGateway(config.twilio);

    default:
      throw new Error(`Unsupported gateway: ${gatewayType}`);
  }
}

export { FonnteGateway, WablasGateway, TwilioGateway };
