# QRIS CPM Payment API Documentation

## Overview

The QRIS (Quick Response Code Indonesian Standard) Customer Present Mode (CPM) Payment API provides integration with multiple payment gateways (Midtrans, Xendit, Tripay) for accepting QRIS payments in the AYAM GEPREK SAMBAL IJO restaurant system.

## Features

- ✅ Multiple gateway support (Midtrans, Xendit, Tripay)
- ✅ QR code generation for Customer Present Mode
- ✅ Payment status tracking with real-time updates
- ✅ Webhook callback handling
- ✅ Payment cancellation support
- ✅ Automatic expiry handling
- ✅ Order status synchronization
- ✅ Comprehensive error handling
- ✅ TypeScript type safety

## API Endpoints

### 1. Create QRIS Payment

**Endpoint:** `POST /api/payments/qris/create`

**Description:** Create a new QRIS payment for an order. Generates a QR code that customers can scan with their e-wallet apps.

**Request Body:**
```typescript
{
  orderId: string;              // Unique order identifier
  amount: number;              // Payment amount
  customerName: string;        // Customer name
  customerEmail?: string;      // Optional customer email
  customerPhone?: string;      // Optional customer phone
  gateway: 'midtrans' | 'xendit' | 'tripay';  // Payment gateway
  items?: Array<{              // Optional item details
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  expiryMinutes?: number;      // QR code expiry time (default: 30)
  metadata?: Record<string, any>;  // Optional metadata
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  paymentId: string;           // Unique payment identifier
  orderId: string;             // Order ID
  amount: number;              // Payment amount
  gateway: string;             // Gateway used
  qrCode: string;              // Base64-encoded QR code image
  qrString: string;            // QRIS string
  expiryTime: Date;            // Expiry timestamp
  paymentUrl?: string;         // Optional payment URL
  createdAt: Date;             // Creation timestamp
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `409 Conflict` - Payment already exists for order
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/payments/qris/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-1234567890-ABCDEF",
    "amount": 50000,
    "customerName": "John Doe",
    "customerPhone": "081234567890",
    "gateway": "midtrans",
    "items": [
      {
        "id": "prod-1",
        "name": "Ayam Geprek Sambal Ijo",
        "quantity": 2,
        "price": 25000
      }
    ],
    "expiryMinutes": 30
  }'
```

---

### 2. Get Payment Status

**Endpoint:** `GET /api/payments/qris/status/[paymentId]`

**Description:** Check the status of a QRIS payment. Automatically checks with gateway if payment is still pending and updates status accordingly.

**URL Parameters:**
- `paymentId` (path) - The payment ID to check

**Response (200 OK):**
```typescript
{
  success: true;
  paymentId: string;
  orderId: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED';
  amount: number;
  paidAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: Date;
  expiryTime: Date;
  gateway: string;
  metadata?: Record<string, any>;
}
```

**Error Responses:**
- `400 Bad Request` - Invalid payment ID
- `404 Not Found` - Payment not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl http://localhost:3000/api/payments/qris/status/PAY-1705123456789-ABCDEF
```

---

### 3. Payment Callback

**Endpoint:** `POST /api/payments/qris/callback`

**Description:** Webhook endpoint to receive payment status updates from payment gateways.

**Request Body:**
```typescript
{
  gateway: 'midtrans' | 'xendit' | 'tripay';
  paymentId: string;
  orderId: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  paidAmount?: number;
  paymentMethod?: string;
  signature?: string;          // Gateway signature for verification
  timestamp?: string;
  metadata?: Record<string, any>;
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
  paymentId: string;
  orderId: string;
  status: string;
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid signature
- `404 Not Found` - Payment not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/payments/qris/callback \
  -H "Content-Type: application/json" \
  -d '{
    "gateway": "midtrans",
    "paymentId": "PAY-1705123456789-ABCDEF",
    "orderId": "ORD-1234567890-ABCDEF",
    "status": "PAID",
    "transactionId": "ORD-1705123456789-ABCDEF",
    "paidAmount": 50000,
    "paymentMethod": "gopay",
    "signature": "abc123..."
  }'
```

---

### 4. Cancel Payment

**Endpoint:** `POST /api/payments/qris/cancel/[paymentId]`

**Description:** Cancel a pending QRIS payment. Only payments with PENDING status can be cancelled.

**URL Parameters:**
- `paymentId` (path) - The payment ID to cancel

**Request Body:**
```typescript
{
  reason: string;  // Cancel reason (required, max 500 chars)
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
  paymentId: string;
  orderId: string;
  status: 'FAILED';
  cancelledAt: Date;
  reason: string;
  gatewayCancelled: boolean;
}
```

**Error Responses:**
- `400 Bad Request` - Validation error or payment cannot be cancelled
- `404 Not Found` - Payment not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/payments/qris/cancel/PAY-1705123456789-ABCDEF \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer requested cancellation"
  }'
```

---

### 5. Expire Payment

**Endpoint:** `POST /api/payments/qris/expire`

**Description:** Manually expire a pending QRIS payment. This is typically called by a scheduled job.

**Request Body:**
```typescript
{
  paymentId: string;
  reason?: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
  paymentId: string;
  orderId: string;
  status: 'EXPIRED';
}
```

**Error Responses:**
- `400 Bad Request` - Validation error or payment cannot be expired
- `404 Not Found` - Payment not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/payments/qris/expire \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "PAY-1705123456789-ABCDEF",
    "reason": "Payment timeout"
  }'
```

---

## Payment Flow

### Standard Payment Flow

```
1. Customer initiates payment
   ↓
2. POST /api/payments/qris/create
   → Creates payment record
   → Generates QR code
   → Returns QR code to frontend
   ↓
3. System displays QR code
   ↓
4. Customer scans QR with e-wallet app
   ↓
5. Customer confirms payment
   ↓
6. Gateway sends callback to POST /api/payments/qris/callback
   → Updates payment status to PAID
   → Updates order payment status
   → Marks order as PAID
   ↓
7. Frontend polls GET /api/payments/qris/status/[paymentId]
   → Shows payment confirmation to customer
```

### Cancellation Flow

```
1. Customer or admin requests cancellation
   ↓
2. POST /api/payments/qris/cancel/[paymentId]
   → Validates payment is PENDING
   → Attempts to cancel at gateway
   → Updates payment status to FAILED
   → Updates order payment status
   ↓
3. Returns success response
```

### Expiry Flow

```
1. Scheduled job checks for expired payments
   ↓
2. POST /api/payments/qris/expire
   → Validates payment is PENDING
   → Expires payment at gateway
   → Updates payment status to EXPIRED
   → Updates order payment status
   ↓
3. Returns success response
```

---

## Payment Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Payment created, waiting for customer payment |
| `PAID` | Payment successfully completed |
| `EXPIRED` | Payment expired (timeout) |
| `FAILED` | Payment failed or cancelled |
| `REFUNDED` | Payment refunded |

---

## Supported Payment Gateways

### Midtrans
- **Status:** Enabled (Mock)
- **Transaction ID Format:** `ORD-{timestamp}-{random}` (uppercase)
- **Configuration:**
  - API Key: `MIDTRANS_API_KEY` (env var)
  - API Secret: `MIDTRANS_API_SECRET` (env var)
  - Merchant ID: `MIDTRANS_MERCHANT_ID` (env var)
  - Sandbox: `true` (default)

### Xendit
- **Status:** Enabled (Mock)
- **Transaction ID Format:** `txn_{timestamp}_{random}`
- **Configuration:**
  - API Key: `XENDIT_API_KEY` (env var)
  - API Secret: `XENDIT_API_SECRET` (env var)
  - Sandbox: `true` (default)

### Tripay
- **Status:** Enabled (Mock)
- **Transaction ID Format:** `TRIPAY{timestamp}{random}` (uppercase)
- **Configuration:**
  - API Key: `TRIPAY_API_KEY` (env var)
  - API Secret: `TRIPAY_API_SECRET` (env var)
  - Merchant ID: `TRIPAY_MERCHANT_ID` (env var)
  - Sandbox: `true` (default)

---

## QR Code Generation

QR codes are generated using the `qrcode` library with the following specifications:
- **Width:** 300px
- **Margin:** 2px
- **Error Correction:** Medium (M)
- **Color:** Black on White
- **Format:** Base64-encoded PNG data URL

**QR Data Format:**
```
QRIS|{transactionId}|{amount}|AYAM_GEPREK_SAMBAL_IJO
```

---

## Database Schema

### QRISPayment Model

```prisma
model QRISPayment {
  id              String              @id @default(cuid())
  orderId         String              @unique
  paymentId       String              @unique
  gateway         QRISPaymentGateway  // MIDTRANS | XENDIT | TRIPAY
  amount          Float
  customerName    String
  customerEmail   String?
  customerPhone   String?
  status          PaymentStatus       @default(PENDING)
  transactionId   String?
  paidAmount      Float?
  paymentMethod   String?
  qrCode          String              // Base64 QR code
  qrString        String              // QRIS string
  paymentUrl      String?
  expiryTime      DateTime
  paidAt          DateTime?
  metadata        String?             // JSON string
  callbackReceived Boolean           @default(false)
  callbackAt      DateTime?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([orderId])
  @@index([paymentId])
  @@index([status])
  @@index([gateway])
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```typescript
{
  success: false;
  error: string;
  details?: any;  // Additional error details (for validation errors)
  message?: string;  // Detailed error message
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (invalid signature) |
| `404` | Not Found |
| `409` | Conflict (duplicate) |
| `500` | Internal Server Error |

---

## Security Features

1. **Signature Verification:** Callbacks can be verified using gateway signatures
2. **Payment ID Validation:** All payment IDs are validated before processing
3. **Status Validation:** Payments can only be cancelled if PENDING
4. **Gateway Validation:** Only enabled gateways can be used
5. **Input Validation:** All inputs are validated using Zod schemas
6. **SQL Injection Protection:** Prisma ORM provides protection
7. **XSS Protection:** Proper data sanitization

---

## Integration Notes

### Frontend Integration

1. **Create Payment:**
   - Call `POST /api/payments/qris/create` when customer initiates payment
   - Display the returned `qrCode` (base64 image) to customer
   - Store `paymentId` for status polling

2. **Poll Payment Status:**
   - Poll `GET /api/payments/qris/status/[paymentId]` every 2-3 seconds
   - Stop polling when status is PAID, EXPIRED, or FAILED
   - Update UI based on status

3. **Handle Payment Completion:**
   - When status is PAID, show success message
   - Redirect to order confirmation page
   - Update order display

4. **Handle Cancellation:**
   - Call `POST /api/payments/qris/cancel/[paymentId]` if customer cancels
   - Show cancellation confirmation

### Order Integration

- The API automatically updates `Order.paymentStatus` when payment status changes
- Only orders with `paymentMethod = 'QRIS_CPM'` are updated
- Order status updates are graceful (don't fail the payment callback)

---

## Environment Variables

```env
# Midtrans Configuration
MIDTRANS_API_KEY=your-midtrans-api-key
MIDTRANS_API_SECRET=your-midtrans-api-secret
MIDTRANS_MERCHANT_ID=your-midtrans-merchant-id

# Xendit Configuration
XENDIT_API_KEY=your-xendit-api-key
XENDIT_API_SECRET=your-xendit-api-secret

# Tripay Configuration
TRIPAY_API_KEY=your-tripay-api-key
TRIPAY_API_SECRET=your-tripay-api-secret
TRIPAY_MERCHANT_ID=your-tripay-merchant-id
```

---

## Testing

### Test Payment Creation

```bash
curl -X POST http://localhost:3000/api/payments/qris/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-ORD-001",
    "amount": 10000,
    "customerName": "Test Customer",
    "gateway": "midtrans",
    "expiryMinutes": 5
  }'
```

### Test Payment Status

```bash
curl http://localhost:3000/api/payments/qris/status/PAY-TEST-001
```

### Test Payment Callback

```bash
curl -X POST http://localhost:3000/api/payments/qris/callback \
  -H "Content-Type: application/json" \
  -d '{
    "gateway": "midtrans",
    "paymentId": "PAY-TEST-001",
    "orderId": "TEST-ORD-001",
    "status": "PAID",
    "paidAmount": 10000
  }'
```

### Test Payment Cancellation

```bash
curl -X POST http://localhost:3000/api/payments/qris/cancel/PAY-TEST-001 \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Test cancellation"
  }'
```

---

## Next Steps

### Production Integration

1. Replace mock implementations with actual gateway APIs:
   - Midtrans: https://docs.midtrans.com/
   - Xendit: https://developers.xendit.co/
   - Tripay: https://tripay.co.id/developer

2. Implement proper signature verification for callbacks
3. Set up webhook endpoints in gateway dashboards
4. Configure production API keys and secrets
5. Test in sandbox environment before going live

### Additional Features

- [ ] Payment refund API
- [ ] Partial payment support
- [ ] Multiple payment methods per order
- [ ] Payment retry mechanism
- [ ] Advanced analytics and reporting
- [ ] Admin dashboard for payment management
- [ ] Email notifications for payment status changes

---

## Support

For issues or questions:
- Check the error messages in console logs
- Verify payment status in database
- Test with mock gateway first
- Review gateway documentation for integration details

---

## Changelog

### [2025-01-15] Initial Release
- Created QRIS CPM Payment API
- Implemented all required endpoints
- Added multi-gateway support
- Integrated QR code generation
- Implemented callback handling
- Added status checking and cancellation
- Integrated with Order model
- Added comprehensive error handling
