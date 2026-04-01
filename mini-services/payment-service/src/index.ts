import { serve } from '@hono/node-server';
import app from './routes.js';
import { logger } from './models/logger.js';
import { paymentStorage } from './models/payment-storage.js';
import { PaymentStatus } from './types/index.js';

const PORT = 3005;

// Start server
logger.info('Starting Payment Service...');

// Cleanup expired transactions every minute
setInterval(() => {
  const expiredCount = paymentStorage.cleanupExpired();
  if (expiredCount > 0) {
    logger.info(`Cleaned up ${expiredCount} expired transactions`);
  }
}, 60 * 1000); // Every minute

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  logger.info(`Payment Service running on http://localhost:${info.port}`);
  logger.info(`Available endpoints:`);
  logger.info(`  POST   /api/payment/qris/create     - Create QRIS payment`);
  logger.info(`  GET    /api/payment/qris/status/:id - Check payment status`);
  logger.info(`  POST   /api/payment/qris/callback   - Handle gateway callback`);
  logger.info(`  POST   /api/payment/qris/expire/:id - Expire payment`);
  logger.info(`  GET    /health                      - Health check`);
  logger.info(`  GET    /api/payment/transactions    - List all transactions`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
