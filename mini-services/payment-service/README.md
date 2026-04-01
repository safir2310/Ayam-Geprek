# Payment Service - QRIS CPM

A dedicated QRIS Customer Present Mode (CPM) payment service for AYAM GEPREK SAMBAL IJO restaurant system. This mini-service handles QR code generation, payment processing, and gateway callbacks with support for multiple payment providers.

## Features

- **QRIS CPM Flow**: Generate QR codes for customers to scan with e-wallet apps
- **Multi-Gateway Support**: Midtrans, Xendit, and Tripay integrations
- **Real-time Payment Status**: Track payment status (PENDING → PAID/EXPIRED/FAILED)
- **Secure Callbacks**: Signature verification for all gateway callbacks
- **Hot Reload**: Automatic restart on file changes using `bun --hot`
- **Comprehensive Logging**: Detailed transaction logging for debugging and auditing
- **Input Validation**: Robust validation using Zod schemas

## Installation

```bash
cd /home/z/my-project/mini-services/payment-service
bun install
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
# Midtrans Configuration
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx

# Xendit Configuration
XENDIT_API_KEY=xnd_development_xxx

# Tripay Configuration
TRIPAY_API_KEY=data-api-key
TRIPAY_PRIVATE_KEY=private-key
TRIPAY_MERCHANT_CODE=merchant-code
```

## Running the Service

### Development Mode (with hot reload)
```bash
bun run dev
```

### Production Mode
```bash
bun run start
```

The service will start on port **3005**.

## API Endpoints

### 1. Create QRIS Payment
**POST** `/api/payment/qris/create`

Create a new QRIS payment transaction and generate QR code.

**Request Body:**
```json
{
  "orderId": "ORD-20240327-001",
  "amount": 50000,
  "gateway": "MIDTRANS",
  "customerEmail": "customer@email.com",
  "customerPhone": "08123456789",
  "expiryMinutes": 15,
  "metadata": {
    "table": "A1",
    "cashier": "John"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "success": true,
    "transactionId": "midtrans-ORD-20240327-001-1711521600000-abc12345",
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "qrString": "MIDTRANS|midtrans-ORD-20240327-001-1711521600000-abc12345|50000",
    "expiryDate": "2024-03-27T08:30:00.000Z",
    "amount": 50000,
    "status": "PENDING"
  }
}
```

### 2. Check Payment Status
**GET** `/api/payment/qris/status/:transactionId`

Check the current status of a payment transaction.

**Response:**
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "success": true,
    "transactionId": "midtrans-ORD-20240327-001-1711521600000-abc12345",
    "orderId": "ORD-20240327-001",
    "status": "PAID",
    "amount": 50000,
    "gateway": "MIDTRANS",
    "createdAt": "2024-03-27T08:15:00.000Z",
    "updatedAt": "2024-03-27T08:18:30.000Z",
    "expiryDate": "2024-03-27T08:30:00.000Z"
  }
}
```

### 3. Handle Gateway Callback
**POST** `/api/payment/qris/callback`

Receive payment status updates from payment gateways.

**Request Body:**
```json
{
  "transactionId": "midtrans-ORD-20240327-001-1711521600000-abc12345",
  "status": "PAID",
  "amount": 50000,
  "paymentMethod": "QRIS",
  "paymentDate": "2024-03-27T08:18:30.000Z",
  "signature": "abc123...",
  "metadata": {
    "payment_channel": "gopay"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Callback processed successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "transactionId": "midtrans-ORD-20240327-001-1711521600000-abc12345",
    "orderId": "ORD-20240327-001",
    "amount": 50000,
    "status": "PAID",
    "gateway": "MIDTRANS",
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "qrString": "MIDTRANS|midtrans-ORD-20240327-001-1711521600000-abc12345|50000",
    "expiryDate": "2024-03-27T08:30:00.000Z",
    "createdAt": "2024-03-27T08:15:00.000Z",
    "updatedAt": "2024-03-27T08:18:30.000Z",
    "customerEmail": "customer@email.com",
    "customerPhone": "08123456789",
    "metadata": {
      "table": "A1",
      "cashier": "John"
    }
  }
}
```

### 4. Expire Payment
**POST** `/api/payment/qris/expire/:transactionId`

Manually expire a pending payment transaction.

**Response:**
```json
{
  "success": true,
  "message": "Payment expired successfully",
  "data": {
    "transactionId": "midtrans-ORD-20240327-001-1711521600000-abc12345",
    "status": "EXPIRED"
  }
}
```

### 5. Health Check
**GET** `/health`

Check service health and status.

**Response:**
```json
{
  "status": "healthy",
  "service": "payment-service",
  "timestamp": "2024-03-27T08:20:00.000Z",
  "transactions": 5
}
```

### 6. List All Transactions (Debug)
**GET** `/api/payment/transactions`

List all payment transactions (for debugging purposes).

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "transactionId": "midtrans-ORD-20240327-001-1711521600000-abc12345",
      "orderId": "ORD-20240327-001",
      "amount": 50000,
      "status": "PAID",
      "gateway": "MIDTRANS",
      "createdAt": "2024-03-27T08:15:00.000Z",
      "expiryDate": "2024-03-27T08:30:00.000Z"
    }
  ]
}
```

## Payment Status Flow

```
PENDING → PAID     (Payment successful)
         → EXPIRED  (Payment timeout)
         → FAILED   (Payment failed)
         → CANCELLED (Manually cancelled)
```

## Supported Payment Gateways

### 1. Midtrans
- **Type**: Payment Gateway
- **Verification**: SHA512 signature
- **Signature Format**: `SHA512(order_id + status_code + gross_amount + server_key)`

### 2. Xendit
- **Type**: Payment Gateway
- **Verification**: HMAC SHA256
- **Signature Format**: `HMAC_SHA256(apiKey + callback_token)`

### 3. Tripay
- **Type**: Payment Gateway
- **Verification**: MD5 hash
- **Signature Format**: `MD5(merchantCode + amount + merchantRef + privateKey)`

## Project Structure

```
payment-service/
├── src/
│   ├── gateways/
│   │   ├── base-gateway.ts       # Base gateway class
│   │   ├── midtrans-gateway.ts   # Midtrans implementation
│   │   ├── xendit-gateway.ts     # Xendit implementation
│   │   ├── tripay-gateway.ts     # Tripay implementation
│   │   └── gateway-factory.ts    # Gateway factory
│   ├── models/
│   │   ├── payment-storage.ts    # In-memory transaction storage
│   │   ├── logger.ts             # Logging utility
│   │   └── validator.ts          # Input validation
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── routes.ts                 # API routes
│   └── index.ts                  # Server entry point
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Usage Examples

### Creating a Payment with cURL

```bash
curl -X POST http://localhost:3005/api/payment/qris/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-20240327-001",
    "amount": 50000,
    "gateway": "MIDTRANS",
    "customerEmail": "customer@email.com",
    "expiryMinutes": 15
  }'
```

### Checking Payment Status

```bash
curl http://localhost:3005/api/payment/qris/status/midtrans-ORD-20240327-001-1711521600000-abc12345
```

### Expiring a Payment

```bash
curl -X POST http://localhost:3005/api/payment/qris/expire/midtrans-ORD-20240327-001-1711521600000-abc12345
```

## Automatic Cleanup

The service automatically checks and expires pending payments every minute. Transactions that have passed their expiry date are automatically marked as `EXPIRED`.

## Security Considerations

1. **Signature Verification**: All gateway callbacks are verified using signature-based authentication
2. **Input Validation**: All inputs are validated using Zod schemas
3. **Environment Variables**: Sensitive credentials are stored in environment variables
4. **HTTPS**: In production, use HTTPS for all API endpoints
5. **CORS**: Configure CORS policies for your frontend application

## Error Handling

The service returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `403` - Forbidden (invalid signature)
- `404` - Not Found (transaction not found)
- `500` - Internal Server Error

## Integration with Main App

This payment service can be integrated with the main restaurant system by:

1. **POS System**: Display QR codes for customers to scan
2. **Order Management**: Update order status when payment is completed
3. **Notifications**: Send WhatsApp notifications on payment completion
4. **Receipt Generation**: Generate receipts after successful payment

## Development

### Adding a New Gateway

1. Create a new gateway class extending `BaseGateway`
2. Implement the `verifyCallback` method
3. Add the gateway to `PaymentGateway` enum in `types/index.ts`
4. Register the gateway in `GatewayFactory.initialize()`

### Testing

Test the endpoints using:

```bash
# Test health endpoint
curl http://localhost:3005/health

# Create a test payment
curl -X POST http://localhost:3005/api/payment/qris/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "amount": 10000,
    "gateway": "MIDTRANS"
  }'
```

## Notes

- This service uses in-memory storage. For production, integrate with a database (Redis, MongoDB, PostgreSQL)
- Payment gateway credentials should be obtained from the respective gateway providers
- The service runs on port 3005 by default
- Hot reload is enabled in development mode using `bun --hot`

## License

Internal use for AYAM GEPREK SAMBAL IJO restaurant system.
