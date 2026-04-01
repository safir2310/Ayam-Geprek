import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { PaymentGateway, PaymentStatus, CreatePaymentRequest, GatewayCallbackPayload } from './types/index.js';
import { GatewayFactory } from './gateways/gateway-factory.js';
import { paymentStorage } from './models/payment-storage.js';
import { logger } from './models/logger.js';
import { PaymentValidator } from './models/validator.js';

const app = new Hono();

// Initialize gateways
GatewayFactory.initialize();

// POST /api/payment/qris/create - Create QRIS payment
app.post(
  '/api/payment/qris/create',
  zValidator('json', createPaymentSchema),
  async (c) => {
    try {
      const body = c.req.valid('json') as CreatePaymentRequest;

      logger.info('Creating QRIS payment', { orderId: body.orderId, amount: body.amount, gateway: body.gateway });

      // Get gateway
      const gateway = GatewayFactory.getGateway(body.gateway);

      // Create payment
      const paymentResponse = await gateway.createPayment(body);

      // Store transaction
      const transaction = paymentStorage.create({
        id: crypto.randomUUID(),
        transactionId: paymentResponse.transactionId,
        orderId: body.orderId,
        amount: body.amount,
        status: paymentResponse.status,
        gateway: body.gateway,
        qrCode: paymentResponse.qrCode,
        qrString: paymentResponse.qrString,
        expiryDate: new Date(paymentResponse.expiryDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        metadata: body.metadata
      });

      logger.info('Payment created successfully', { transactionId: transaction.transactionId, orderId: transaction.orderId });

      return c.json({
        success: true,
        message: 'Payment created successfully',
        data: paymentResponse
      }, 201);
    } catch (error: any) {
      logger.error('Failed to create payment', error);

      if (error.name === 'ZodError') {
        return c.json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        }, 400);
      }

      return c.json({
        success: false,
        message: error.message || 'Failed to create payment'
      }, 500);
    }
  }
);

// GET /api/payment/qris/status/:transactionId - Check payment status
app.get('/api/payment/qris/status/:transactionId', async (c) => {
  try {
    const transactionId = c.req.param('transactionId');

    logger.info('Checking payment status', { transactionId });

    const transaction = paymentStorage.get(transactionId);

    if (!transaction) {
      logger.warn('Transaction not found', { transactionId });
      return c.json({
        success: false,
        message: 'Transaction not found'
      }, 404);
    }

    // Check if payment is expired
    if (transaction.status === PaymentStatus.PENDING && transaction.expiryDate < new Date()) {
      paymentStorage.updateStatus(transactionId, PaymentStatus.EXPIRED);
      transaction.status = PaymentStatus.EXPIRED;
      logger.info('Payment expired', { transactionId });
    }

    const response = {
      success: true,
      transactionId: transaction.transactionId,
      orderId: transaction.orderId,
      status: transaction.status,
      amount: transaction.amount,
      gateway: transaction.gateway,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      expiryDate: transaction.expiryDate.toISOString()
    };

    logger.info('Payment status retrieved', { transactionId, status: transaction.status });

    return c.json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: response
    });
  } catch (error: any) {
    logger.error('Failed to get payment status', error);
    return c.json({
      success: false,
      message: error.message || 'Failed to get payment status'
    }, 500);
  }
});

// POST /api/payment/qris/callback - Handle gateway callback
app.post('/api/payment/qris/callback', async (c) => {
  try {
    const body = await c.req.json() as GatewayCallbackPayload;

    logger.info('Received payment callback', { transactionId: body.transactionId, status: body.status });

    // Validate callback payload
    try {
      PaymentValidator.validateCallback(body);
    } catch (validationError: any) {
      logger.error('Invalid callback payload', validationError);
      return c.json({
        success: false,
        message: 'Invalid callback payload',
        errors: validationError.errors
      }, 400);
    }

    // Get transaction
    const transaction = paymentStorage.get(body.transactionId);
    if (!transaction) {
      logger.warn('Transaction not found for callback', { transactionId: body.transactionId });
      return c.json({
        success: false,
        message: 'Transaction not found'
      }, 404);
    }

    // Verify callback signature
    const gateway = GatewayFactory.getGateway(transaction.gateway);
    if (!gateway.verifyCallback(body)) {
      logger.warn('Invalid callback signature', { transactionId: body.transactionId });
      return c.json({
        success: false,
        message: 'Invalid signature'
      }, 403);
    }

    // Update payment status
    const updated = paymentStorage.updateStatus(body.transactionId, body.status);
    if (updated) {
      logger.info('Payment status updated via callback', {
        transactionId: body.transactionId,
        oldStatus: transaction.status,
        newStatus: body.status
      });
    }

    return c.json({
      success: true,
      message: 'Callback processed successfully',
      data: updated
    });
  } catch (error: any) {
    logger.error('Failed to process callback', error);
    return c.json({
      success: false,
      message: error.message || 'Failed to process callback'
    }, 500);
  }
});

// POST /api/payment/qris/expire/:transactionId - Expire payment
app.post('/api/payment/qris/expire/:transactionId', async (c) => {
  try {
    const transactionId = c.req.param('transactionId');

    logger.info('Expiring payment', { transactionId });

    const transaction = paymentStorage.get(transactionId);
    if (!transaction) {
      logger.warn('Transaction not found', { transactionId });
      return c.json({
        success: false,
        message: 'Transaction not found'
      }, 404);
    }

    if (transaction.status !== PaymentStatus.PENDING) {
      logger.warn('Cannot expire non-pending payment', { transactionId, status: transaction.status });
      return c.json({
        success: false,
        message: 'Can only expire pending payments'
      }, 400);
    }

    // Update status to expired
    const updated = paymentStorage.updateStatus(transactionId, PaymentStatus.EXPIRED);
    logger.info('Payment expired successfully', { transactionId });

    return c.json({
      success: true,
      message: 'Payment expired successfully',
      data: updated
    });
  } catch (error: any) {
    logger.error('Failed to expire payment', error);
    return c.json({
      success: false,
      message: error.message || 'Failed to expire payment'
    }, 500);
  }
});

// GET /health - Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    transactions: paymentStorage.count()
  });
});

// GET /api/payment/transactions - List all transactions (for debugging)
app.get('/api/payment/transactions', (c) => {
  const transactions = paymentStorage.getAll();
  return c.json({
    success: true,
    count: transactions.length,
    data: transactions.map(t => ({
      transactionId: t.transactionId,
      orderId: t.orderId,
      amount: t.amount,
      status: t.status,
      gateway: t.gateway,
      createdAt: t.createdAt,
      expiryDate: t.expiryDate
    }))
  });
});

// Schema for zod validator
const createPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive().min(1000),
  gateway: z.nativeEnum(PaymentGateway),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(10).optional(),
  expiryMinutes: z.number().int().positive().min(1).max(1440).optional(),
  metadata: z.record(z.any()).optional()
});

export default app;
