type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  info(message: string, meta?: any) {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, meta?: any) {
    console.error(this.formatMessage('error', message, meta));
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  logMessageSent(to: string, messageId: string, template?: string) {
    this.info('WhatsApp message sent', { to, messageId, template });
  }

  logMessageFailed(to: string, error: string, template?: string) {
    this.error('WhatsApp message failed', { to, error, template });
  }

  logMessageQueued(messageId: string, to: string, priority: string) {
    this.info('Message queued for retry', { messageId, to, priority });
  }

  logGatewayUsed(gateway: string) {
    this.info('Using WhatsApp gateway', { gateway });
  }
}

export const logger = new Logger();
