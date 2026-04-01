import { ILogger } from '../types/index.js';

class Logger implements ILogger {
  private serviceName: string;

  constructor(serviceName: string = 'payment-service') {
    this.serviceName = serviceName;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.serviceName}] ${message}`;
  }

  info(message: string, data?: any): void {
    const formatted = this.formatMessage('INFO', message);
    console.log(formatted, data ? JSON.stringify(data, null, 2) : '');
  }

  error(message: string, error?: any): void {
    const formatted = this.formatMessage('ERROR', message);
    console.error(formatted, error ? JSON.stringify(error, null, 2) : '');
  }

  warn(message: string, data?: any): void {
    const formatted = this.formatMessage('WARN', message);
    console.warn(formatted, data ? JSON.stringify(data, null, 2) : '');
  }

  debug(message: string, data?: any): void {
    const formatted = this.formatMessage('DEBUG', message);
    console.debug(formatted, data ? JSON.stringify(data, null, 2) : '');
  }
}

export const logger = new Logger();
