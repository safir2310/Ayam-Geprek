import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createGateway } from './gateways/index.js';
import { MessageTemplates } from './templates.js';
import { messageQueue } from './queue.js';
import { logger } from './logger.js';
import type { OrderData, PaymentData, OrderStatus, GatewayConfig } from './types.js';

const app = new Hono();
const PORT = parseInt(process.env.PORT || '3006', 10);

// Initialize WhatsApp Gateway
const gatewayConfig: GatewayConfig = {
  fonnte: process.env.FONNTE_TOKEN ? {
    token: process.env.FONNTE_TOKEN,
    apiUrl: process.env.FONNTE_API_URL || 'https://api.fonnte.com/send',
  } : undefined,
  wablas: process.env.WABLAS_TOKEN ? {
    token: process.env.WABLAS_TOKEN,
    domain: process.env.WABLAS_DOMAIN || '',
  } : undefined,
  twilio: process.env.TWILIO_ACCOUNT_SID ? {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
  } : undefined,
};

const gatewayType = process.env.WHATSAPP_GATEWAY || 'fonnte';
const whatsappGateway = createGateway(gatewayType, gatewayConfig);

// Make gateway globally available for queue
(global as any).whatsappGateway = whatsappGateway;

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'WhatsApp Notification Service',
    version: '1.0.0',
    status: 'running',
    gateway: gatewayType,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', gateway: gatewayType });
});

// Send WhatsApp message
app.post('/api/whatsapp/send', async (c) => {
  try {
    const body = await c.req.json();

    const { to, message, useQueue = false, priority = 'medium' } = body;

    if (!to || !message) {
      return c.json({ success: false, error: 'Missing required fields: to, message' }, 400);
    }

    if (useQueue) {
      const queueId = messageQueue.enqueue({ to, message }, priority);
      return c.json({
        success: true,
        queued: true,
        queueId,
        message: 'Message added to queue',
      });
    }

    const response = await whatsappGateway.send({ to, message });
    return c.json(response);
  } catch (error) {
    logger.error('Error in /api/whatsapp/send', { error });
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});

// Send order confirmation to customer
app.post('/api/whatsapp/order-confirm', async (c) => {
  try {
    const order: OrderData = await c.req.json();

    if (!order.customerPhone || !order.orderId || !order.items) {
      return c.json({ success: false, error: 'Missing required order fields' }, 400);
    }

    const message = MessageTemplates.orderConfirmation(order);
    const response = await whatsappGateway.send({
      to: order.customerPhone,
      message,
      template: 'order-confirmation',
      data: { orderId: order.orderId },
    });

    // Also notify admin about new order
    const adminPhone = process.env.ADMIN_PHONE;
    if (adminPhone) {
      const adminMessage = MessageTemplates.newOrderNotification(order);
      messageQueue.enqueue({ to: adminPhone, message: adminMessage }, 'high');
    }

    return c.json(response);
  } catch (error) {
    logger.error('Error in /api/whatsapp/order-confirm', { error });
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});

// Send order status update
app.post('/api/whatsapp/order-update', async (c) => {
  try {
    const body = await c.req.json();

    const { orderId, status, customerPhone, estimatedTime, useQueue = false } = body;

    if (!orderId || !status || !customerPhone) {
      return c.json({ success: false, error: 'Missing required fields: orderId, status, customerPhone' }, 400);
    }

    const message = MessageTemplates.orderStatusUpdate(orderId, status as OrderStatus, estimatedTime);

    if (useQueue) {
      const queueId = messageQueue.enqueue(
        { to: customerPhone, message, template: 'order-update', data: { orderId, status } },
        'medium'
      );
      return c.json({
        success: true,
        queued: true,
        queueId,
        message: 'Order update message queued',
      });
    }

    const response = await whatsappGateway.send({
      to: customerPhone,
      message,
      template: 'order-update',
      data: { orderId, status },
    });

    return c.json(response);
  } catch (error) {
    logger.error('Error in /api/whatsapp/order-update', { error });
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});

// Send payment confirmation
app.post('/api/whatsapp/payment-confirm', async (c) => {
  try {
    const payment: PaymentData = await c.req.json();

    if (!payment.orderId || !payment.amount || !payment.customerName || !payment.customerPhone) {
      return c.json({ success: false, error: 'Missing required payment fields' }, 400);
    }

    const message = MessageTemplates.paymentConfirmation(payment);
    const response = await whatsappGateway.send({
      to: payment.customerPhone,
      message,
      template: 'payment-confirmation',
      data: { orderId: payment.orderId },
    });

    return c.json(response);
  } catch (error) {
    logger.error('Error in /api/whatsapp/payment-confirm', { error });
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});

// Send promotional message
app.post('/api/whatsapp/promotional', async (c) => {
  try {
    const body = await c.req.json();

    const { to, title, content, promoCode, validUntil, useQueue = true } = body;

    if (!to || !title || !content) {
      return c.json({ success: false, error: 'Missing required fields: to, title, content' }, 400);
    }

    const message = MessageTemplates.promotionalMessage(title, content, promoCode, validUntil);

    if (useQueue) {
      const queueId = messageQueue.enqueue({ to, message, template: 'promotional' }, 'low');
      return c.json({
        success: true,
        queued: true,
        queueId,
        message: 'Promotional message queued',
      });
    }

    const response = await whatsappGateway.send({
      to,
      message,
      template: 'promotional',
    });

    return c.json(response);
  } catch (error) {
    logger.error('Error in /api/whatsapp/promotional', { error });
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});

// Check message status
app.get('/api/whatsapp/status/:messageId', async (c) => {
  try {
    const messageId = c.req.param('messageId');

    if (!messageId) {
      return c.json({ success: false, error: 'Message ID is required' }, 400);
    }

    const status = await whatsappGateway.checkStatus(messageId);
    return c.json({ success: true, ...status });
  } catch (error) {
    logger.error('Error in /api/whatsapp/status/:messageId', { error });
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});

// Get queue status
app.get('/api/whatsapp/queue/status', (c) => {
  const status = messageQueue.getStatus();
  return c.json({ success: true, ...status });
});

// Clear queue (admin endpoint)
app.post('/api/whatsapp/queue/clear', (c) => {
  messageQueue.clear();
  return c.json({ success: true, message: 'Queue cleared' });
});

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Endpoint not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  logger.error('Unhandled error', { error: err.message });
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// Start server
logger.info(`Starting WhatsApp Notification Service on port ${PORT}`);
logger.info(`Using gateway: ${gatewayType}`);

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  logger.info(`Server is running on http://localhost:${info.port}`);
});
