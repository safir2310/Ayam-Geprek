# WhatsApp Notification Service

A standalone WhatsApp notification service for AYAM GEPREK SAMBAL IJO restaurant system. Built with Bun, Hono, and supports multiple WhatsApp gateway providers.

## Features

- ✅ Multiple gateway support (Fonnte, Wablas, Twilio)
- ✅ Pre-built message templates for orders, payments, and promotions
- ✅ Message queue with automatic retry for failed messages
- ✅ Comprehensive logging for all messages
- ✅ Hot reload support with `bun --hot`
- ✅ RESTful API endpoints
- ✅ Admin notifications for new orders
- ✅ Customer notifications for order updates

## Installation

1. Install dependencies:
```bash
bun install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` file with your gateway credentials:
```env
PORT=3006
WHATSAPP_GATEWAY=fonnte
FONNTE_TOKEN=your_token_here
ADMIN_PHONE=+6281234567890
```

## Usage

### Start the service

Development mode with hot reload:
```bash
bun run dev
```

Production mode:
```bash
bun start
```

The service will start on port `3006`.

## API Endpoints

### 1. Send Custom Message

**POST** `/api/whatsapp/send`

Send a custom WhatsApp message.

**Request Body:**
```json
{
  "to": "+6281234567890",
  "message": "Hello! This is a test message.",
  "useQueue": false,
  "priority": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_1234567890",
  "gateway": "fonnte"
}
```

### 2. Send Order Confirmation

**POST** `/api/whatsapp/order-confirm`

Send order confirmation to customer and notify admin about new order.

**Request Body:**
```json
{
  "orderId": "ORD-001",
  "customerName": "John Doe",
  "customerPhone": "+6281234567890",
  "items": [
    {
      "name": "Ayam Geprek Original",
      "quantity": 2,
      "price": 15000
    }
  ],
  "totalAmount": 30000,
  "paymentMethod": "QRIS",
  "orderType": "dine_in",
  "estimatedTime": 15
}
```

### 3. Send Order Status Update

**POST** `/api/whatsapp/order-update`

Send order status update to customer.

**Request Body:**
```json
{
  "orderId": "ORD-001",
  "status": "processing",
  "customerPhone": "+6281234567890",
  "estimatedTime": 10,
  "useQueue": false
}
```

**Status values:** `pending`, `confirmed`, `processing`, `completed`, `cancelled`, `ready`

### 4. Send Payment Confirmation

**POST** `/api/whatsapp/payment-confirm`

Send payment confirmation to customer.

**Request Body:**
```json
{
  "orderId": "ORD-001",
  "amount": 30000,
  "paymentMethod": "QRIS",
  "transactionId": "TXN-123456",
  "customerName": "John Doe",
  "customerPhone": "+6281234567890"
}
```

### 5. Send Promotional Message

**POST** `/api/whatsapp/promotional`

Send promotional message to customers.

**Request Body:**
```json
{
  "to": "+6281234567890",
  "title": "Special Offer!",
  "content": "Get 20% off on all menu items this weekend!",
  "promoCode": "WEEKEND20",
  "validUntil": "2024-12-31",
  "useQueue": true
}
```

### 6. Check Message Status

**GET** `/api/whatsapp/status/:messageId`

Check the delivery status of a message.

**Response:**
```json
{
  "success": true,
  "status": "delivered",
  "delivered": true
}
```

### 7. Get Queue Status

**GET** `/api/whatsapp/queue/status`

Get current message queue status.

**Response:**
```json
{
  "success": true,
  "pending": 5,
  "processing": false,
  "messages": [
    {
      "id": "msg_123",
      "to": "+6281234567890",
      "attempts": 1
    }
  ]
}
```

### 8. Clear Queue

**POST** `/api/whatsapp/queue/clear`

Clear all pending messages in the queue.

## Message Templates

### New Order Notification (Admin)
Sent to admin/cashier when a new order is received.

### Order Confirmation (Customer)
Sent to customer when order is confirmed.

### Order Status Update (Customer)
Sent to customer when order status changes.

### Payment Confirmation (Customer)
Sent to customer when payment is received.

### Promotional Message (Customer)
Custom promotional messages with optional promo codes.

## Gateway Configuration

### Fonnte
```env
WHATSAPP_GATEWAY=fonnte
FONNTE_TOKEN=your_fonnte_token
FONNTE_API_URL=https://api.fonnte.com/send
```

### Wablas
```env
WHATSAPP_GATEWAY=wablas
WABLAS_TOKEN=your_wablas_token
WABLAS_DOMAIN=your_domain.wablas.com
```

### Twilio
```env
WHATSAPP_GATEWAY=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Message Queue

The service includes a built-in message queue for reliable message delivery:

- **Automatic retry**: Failed messages are automatically retried up to 3 times
- **Priority levels**: High, medium, and low priority messages
- **Configurable delays**: Retry delay is configurable (default: 5 seconds)
- **Queue monitoring**: Check queue status via API

### Queue Configuration

```env
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=5000
```

## Logging

All messages and operations are logged with timestamps and details:

- ✅ Message sent successfully
- ❌ Message failed
- 📋 Message queued
- 🔄 Gateway used
- ⚠️ Warnings and errors

## Project Structure

```
whatsapp-service/
├── src/
│   ├── index.ts          # Main server file
│   ├── types.ts          # TypeScript type definitions
│   ├── templates.ts      # Message templates
│   ├── gateways/
│   │   └── index.ts      # Gateway implementations
│   ├── queue.ts          # Message queue
│   └── logger.ts         # Logging utility
├── .env.example          # Example environment variables
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # This file
```

## Testing the Service

### Test health check
```bash
curl http://localhost:3006/
```

### Test send message
```bash
curl -X POST http://localhost:3006/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+6281234567890",
    "message": "Test message from WhatsApp Service"
  }'
```

### Test order confirmation
```bash
curl -X POST http://localhost:3006/api/whatsapp/order-confirm \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "customerName": "Test Customer",
    "customerPhone": "+6281234567890",
    "items": [{"name": "Test Item", "quantity": 1, "price": 15000}],
    "totalAmount": 15000,
    "paymentMethod": "QRIS",
    "estimatedTime": 15
  }'
```

## Integration with Main System

To integrate this service with the main restaurant system:

1. Make HTTP requests from the main system to this service
2. Use the appropriate endpoints for different notifications
3. Set the `ADMIN_PHONE` environment variable to receive new order notifications
4. Enable `useQueue` for non-urgent messages to ensure delivery

Example integration:

```typescript
// Send order confirmation from main system
const response = await fetch('http://localhost:3006/api/whatsapp/order-confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.id,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    items: order.items,
    totalAmount: order.total,
    paymentMethod: order.paymentMethod,
    estimatedTime: 15
  })
});
```

## Troubleshooting

### Service not starting
- Check if port 3006 is already in use
- Verify environment variables are set correctly

### Messages not sending
- Verify gateway credentials in `.env`
- Check gateway API status
- Review logs for error messages

### Queue not processing
- Check if gateway is initialized
- Verify retry configuration
- Review queue status via API

## License

Part of AYAM GEPREK SAMBAL IJO Restaurant System
