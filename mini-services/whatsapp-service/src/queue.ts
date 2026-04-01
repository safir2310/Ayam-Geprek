import type { QueuedMessage, WhatsAppMessage, MessageResponse } from './types.js';
import { logger } from './logger.js';

class MessageQueue {
  private queue: Map<string, QueuedMessage> = new Map();
  private processing: boolean = false;
  private maxRetryAttempts: number = 3;
  private retryDelayMs: number = 5000;

  constructor() {
    this.maxRetryAttempts = parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10);
    this.retryDelayMs = parseInt(process.env.RETRY_DELAY_MS || '5000', 10);
  }

  // Add message to queue
  enqueue(message: WhatsAppMessage, priority: 'high' | 'medium' | 'low' = 'medium'): string {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedMessage: QueuedMessage = {
      ...message,
      id,
      attempts: 0,
      maxAttempts: this.maxRetryAttempts,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
      priority,
    };

    this.queue.set(id, queuedMessage);
    logger.logMessageQueued(id, message.to, priority);
    this.processQueue();

    return id;
  }

  // Process queue
  private async processQueue() {
    if (this.processing) return;

    this.processing = true;

    try {
      const now = Date.now();
      const messages = Array.from(this.queue.values())
        .filter(msg => msg.nextRetryAt <= now)
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority] || a.nextRetryAt - b.nextRetryAt;
        });

      for (const message of messages) {
        await this.processMessage(message);
      }
    } finally {
      this.processing = false;
    }
  }

  // Process single message
  private async processMessage(message: QueuedMessage) {
    if (message.attempts >= message.maxAttempts) {
      logger.error('Message max retries exceeded, removing from queue', {
        id: message.id,
        to: message.to,
        attempts: message.attempts,
      });
      this.queue.delete(message.id);
      return;
    }

    message.attempts++;
    message.nextRetryAt = Date.now() + this.retryDelayMs;

    try {
      const gateway = (global as any).whatsappGateway;
      if (!gateway) {
        throw new Error('WhatsApp gateway not initialized');
      }

      const response = await gateway.send({
        to: message.to,
        message: message.message,
        template: message.template,
        data: message.data,
      });

      if (response.success) {
        logger.info('Message sent successfully from queue', {
          id: message.id,
          to: message.to,
          messageId: response.messageId,
        });
        this.queue.delete(message.id);
      } else {
        logger.warn('Message failed, will retry', {
          id: message.id,
          to: message.to,
          attempt: message.attempts,
          error: response.error,
        });
      }
    } catch (error) {
      logger.error('Error processing queued message', {
        id: message.id,
        to: message.to,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get queue status
  getStatus(): { pending: number; processing: boolean; messages: Array<{ id: string; to: string; attempts: number }> } {
    return {
      pending: this.queue.size,
      processing: this.processing,
      messages: Array.from(this.queue.values()).map(msg => ({
        id: msg.id,
        to: msg.to,
        attempts: msg.attempts,
      })),
    };
  }

  // Clear queue
  clear(): void {
    const count = this.queue.size;
    this.queue.clear();
    logger.info('Message queue cleared', { count });
  }

  // Remove specific message
  remove(id: string): boolean {
    return this.queue.delete(id);
  }
}

export const messageQueue = new MessageQueue();
