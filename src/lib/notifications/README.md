# WhatsApp Notification System

## Overview

This module provides a comprehensive WhatsApp notification system for the AYAM GEPREK SAMBAL IJO restaurant management system. It supports multiple WhatsApp gateways (Fonnte, Wablas, Twilio) and provides a queued notification system with automatic retry logic.

## Features

- **Multiple Gateway Support**: Fonnte, Wablas, Twilio
- **Message Queue**: All notifications are queued in the database
- **Automatic Retry**: Failed notifications are automatically retried (up to 3 times)
- **Pre-built Templates**: Ready-to-use message templates for common scenarios
- **Type Safety**: Full TypeScript support
- **Database Integration**: Notifications stored in Prisma database

## Architecture

### Directory Structure

```
src/lib/notifications/
├── gateways.ts          # WhatsApp gateway implementations (mock)
├── templates.ts         # Message templates for different notification types
├── queue-service.ts     # Core notification queue management
├── helpers.ts           # Convenience helper functions
└── README.md           # This file

src/app/api/notifications/
├── whatsapp/
│   ├── send/route.ts  # Send custom WhatsApp message
│   ├── order/route.ts # Send order notification to admin
│   └── payment/route.ts # Send payment confirmation to customer
└── queue/
    ├── route.ts       # Get notification queue
    └── process/route.ts # Process pending notifications
```

## Database Schema

```prisma
model Notification {
  id        String           @id @default(cuid())
  type      NotificationType
  recipient String
  message   String
  status    NotificationStatus @default(PENDING)
  attempts  Int              @default(0)
  sentAt    DateTime?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
}

enum NotificationType {
  ORDER_NEW
  ORDER_CONFIRMED
  ORDER_COMPLETED
  PAYMENT_RECEIVED
  STOCK_LOW
  STOCK_EMPTY
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}
```

## API Endpoints

### 1. Send Custom WhatsApp Message

**Endpoint:** `POST /api/notifications/whatsapp/send`

**Request Body:**
```json
{
  "recipient": "081234567890",
  "type": "ORDER_NEW",
  "templateData": {
    "customerName": "John Doe",
    "orderNumber": "ORD-12345678",
    "orderTotal": 50000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification queued successfully",
  "notification": {
    "id": "clxxxxx",
    "type": "ORDER_NEW",
    "recipient": "081234567890",
    "message": "...",
    "status": "PENDING",
    "attempts": 0,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### 2. Send Order Notification

**Endpoint:** `POST /api/notifications/whatsapp/order`

**Request Body:**
```json
{
  "orderId": "order_id_here",
  "adminPhone": "081234567890"
}
```

### 3. Send Payment Confirmation

**Endpoint:** `POST /api/notifications/whatsapp/payment`

**Request Body:**
```json
{
  "orderId": "order_id_here"
}
```

### 4. Get Notification Queue

**Endpoint:** `GET /api/notifications/queue`

**Query Parameters:**
- `status` (optional): PENDING, SENT, FAILED
- `type` (optional): ORDER_NEW, ORDER_CONFIRMED, etc.
- `limit` (optional, default: 50): Number of results
- `offset` (optional, default: 0): Pagination offset

**Example:**
```
GET /api/notifications/queue?status=PENDING&limit=20
```

### 5. Process Notifications

**Endpoint:** `POST /api/notifications/queue/process`

**Request Body:**
```json
{
  "action": "process",
  "limit": 50,
  "retryFailed": false
}
```

**Actions:**
- `process`: Process pending notifications only
- `retry`: Retry failed notifications
- `all`: Process both pending and failed notifications

## Usage Examples

### Using Helper Functions

```typescript
import {
  notifyNewOrder,
  notifyOrderConfirmed,
  notifyPaymentReceived,
  notifyLowStock
} from '@/lib/notifications/helpers';

// Send new order notification to admin
await notifyNewOrder('order_id', '081234567890');

// Send order confirmation to customer
await notifyOrderConfirmed('order_id');

// Send payment confirmation to customer
await notifyPaymentReceived('order_id');

// Send low stock alert to admin
await notifyLowStock('product_id', '081234567890');
```

### Using Queue Service Directly

```typescript
import { createNotification } from '@/lib/notifications/queue-service';

// Create custom notification
await createNotification({
  type: 'ORDER_NEW',
  recipient: '081234567890',
  templateData: {
    customerName: 'John Doe',
    orderNumber: 'ORD-12345678',
    orderTotal: 50000,
    storeName: 'AYAM GEPREK SAMBAL IJO'
  }
});
```

### Processing Notifications

```typescript
import { processPendingNotifications, retryFailedNotifications } from '@/lib/notifications/queue-service';

// Process pending notifications
const result = await processPendingNotifications(50);
console.log(`Processed ${result.processed}, Succeeded: ${result.succeeded}, Failed: ${result.failed}`);

// Retry failed notifications
const retryResult = await retryFailedNotifications(20);
```

## Message Templates

### 1. New Order (to Admin)
```
🔔 PESANAN BARU
🏪 AYAM GEPREK SAMBAL IJO

📋 No. Pesanan: ORD-12345678
👤 Nama: John Doe
📍 Alamat: Jl. Contoh No. 123

🍽️ Detail Pesanan:
• Ayam Geprek x2 - Rp 40,000
• Es Teh Manis x2 - Rp 10,000

💰 Total: Rp 50,000
⏱️ Estimasi: 30 menit

⚠️ Segera konfirmasi pesanan ini!
```

### 2. Order Confirmed (to Customer)
```
✅ PESANAN DIKONFIRMASI
🏪 AYAM GEPREK SAMBAL IJO

Halo, John Doe! 👋

Pesanan Anda telah dikonfirmasi:
📋 No. Pesanan: ORD-12345678
⏱️ Estimasi Waktu: 30 menit

Pesanan Anda sedang kami siapkan dengan hati-hati.
Kami akan menginformasikan ketika pesanan siap diantar.

Terima kasih telah memesan di AYAM GEPREK SAMBAL IJO! 🍗🌶️
```

### 3. Payment Received (to Customer)
```
💳 PEMBAYARAN DITERIMA
🏪 AYAM GEPREK SAMBAL IJO

Halo, John Doe! 👋

Pembayaran Anda telah kami terima:
📋 No. Pesanan: ORD-12345678
💰 Jumlah: Rp 50,000
🏦 Metode: QRIS
📅 Tanggal: 15/01/2025 10:30:00

Pesanan Anda sedang diproses.
Selamat menikmati hidangan kami! 🍗🌶️

Terima kasih!
```

### 4. Low Stock Alert (to Admin)
```
⚠️ STOK MENIPIS
🏪 AYAM GEPREK SAMBAL IJO

Perhatian! Stok produk menipis:

📦 Produk: Ayam Geprek
📊 Stok Saat Ini: 3
📉 Minimum Stok: 5
⚡ Sisa: -2

Segera lakukan restok untuk menghindari kehabisan stok!

Hubungi supplier atau perbarui stok di sistem.
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# WhatsApp Gateway Selection (fonnte, wablas, twilio)
WHATSAPP_GATEWAY=fonnte

# Fonnte Configuration
FONNTE_API_KEY=your_fonnte_api_key_here
FONNTE_SENDER_NUMBER=081234567890

# Wablas Configuration (if using Wablas)
WABLAS_API_KEY=your_wablas_api_key_here
WABLAS_SENDER_NUMBER=081234567890

# Twilio Configuration (if using Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+6281234567890
```

## Gateway Implementation Notes

### Current Status: Mock Implementation

The current implementation uses **mock** versions of all gateways. To use real gateways:

1. **Fonnte**:
   - Replace the mock implementation in `gateways.ts` with actual API calls
   - API Documentation: https://docs.fonnte.com
   - Example endpoint: `https://api.fonnte.com/send`

2. **Wablas**:
   - Replace the mock implementation in `gateways.ts` with actual API calls
   - API Documentation: https://doc.wablas.com
   - Example endpoint: `https://solo.wablas.com/api/send-message`

3. **Twilio**:
   - Install: `npm install twilio`
   - Replace the mock implementation with Twilio SDK
   - API Documentation: https://www.twilio.com/docs/whatsapp/quickstart/node

### Example: Implementing Real Fonnte Gateway

```typescript
import axios from 'axios';

export class FonnteGateway {
  async send(to: string, message: string): Promise<SendMessageResult> {
    try {
      const response = await axios.post(
        'https://api.fonnte.com/send',
        {
          target: to,
          message,
        },
        {
          headers: {
            Authorization: this.config.apiKey,
          },
        }
      );

      return {
        success: response.data.status,
        messageId: response.data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
```

## Notification Types

| Type | Description | Recipient |
|------|-------------|-----------|
| `ORDER_NEW` | New order received | Admin/Cashier |
| `ORDER_CONFIRMED` | Order confirmed by restaurant | Customer |
| `ORDER_COMPLETED` | Order completed/delivered | Customer |
| `PAYMENT_RECEIVED` | Payment confirmed | Customer |
| `STOCK_LOW` | Product stock below minimum | Admin |
| `STOCK_EMPTY` | Product stock is zero | Admin |

## Retry Logic

- Notifications that fail to send are marked as `FAILED`
- Failed notifications with `attempts < 3` can be retried
- After 3 failed attempts, notifications are permanently marked as `FAILED`
- Use the `process` endpoint with `action: "retry"` to retry failed notifications

## Best Practices

1. **Queue Processing**: Set up a cron job or scheduled task to process notifications every few minutes
2. **Error Monitoring**: Monitor failed notifications and investigate recurring issues
3. **Rate Limiting**: Respect gateway API rate limits
4. **Phone Number Format**: Ensure phone numbers are in correct format (e.g., `62` or `08` prefix)
5. **Message Length**: Keep messages under 1600 characters to avoid issues
6. **Testing**: Test all notification types before production deployment

## Integration with Order System

The notification system can be integrated with the order creation and status update workflows:

```typescript
// In order creation endpoint
const result = await prisma.order.create({
  // ... order creation logic
});

// Notify admin about new order
await notifyNewOrder(result.id, '081234567890');

// In order status update endpoint
if (status === 'CONFIRMED') {
  await notifyOrderConfirmed(orderId);
} else if (status === 'COMPLETED') {
  await notifyOrderCompleted(orderId);
}
```

## Troubleshooting

### Notifications not sending

1. Check gateway API credentials in `.env`
2. Verify phone number format
3. Check gateway service status
4. Review notification queue status

### High failure rate

1. Check gateway API rate limits
2. Verify message content doesn't violate policies
3. Review gateway-specific restrictions
4. Check network connectivity

### Duplicate notifications

1. Ensure notification creation is idempotent
2. Check for duplicate API calls
3. Review order status update logic

## Next Steps

1. Implement real gateway API calls
2. Set up scheduled queue processing (cron job)
3. Add notification analytics and reporting
4. Create admin dashboard for notification monitoring
5. Implement webhook support for delivery receipts
6. Add multi-language message templates
7. Create notification preference system for customers

## Support

For issues or questions, refer to the gateway documentation:
- Fonnte: https://docs.fonnte.com
- Wablas: https://doc.wablas.com
- Twilio: https://www.twilio.com/docs/whatsapp
