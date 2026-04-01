# QRIS CPM Payment API Documentation

## Overview

The QRIS CPM (Customer Present Mode) Payment API provides integration with multiple payment gateways for processing QRIS payments in the AYAM GEPREK SAMBAL IJO restaurant system.

## Supported Payment Gateways

- **Midtrans** - Indonesia's leading payment gateway
- **Xendit** - Modern payment infrastructure for Indonesia
- **Tripay** - Indonesian payment gateway with QRIS support

## API Endpoints

### 1. Create QRIS Payment

**Endpoint:** `POST /api/payments/qris/create`

**Description:** Create a new QRIS payment (Customer Present Mode) for an order.

**Request Body:**
```json
{
  "orderId": "ORD-1234567890",
  "amount": 50000,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
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
  "expiryMinutes": 30,
  "metadata": {
    "tableNumber": "A1"
  }
}
```

**Request Parameters:**
- `orderId` (string, required): Unique order identifier
- `amount` (number, required): Payment amount in IDR
- `customerName` (string, required): Customer's full name
- `customerEmail` (string, optional): Customer's email address
- `customerPhone` (string, optional): Customer's phone number
- `gateway` (enum, required): Payment gateway - `midtrans`, `xendit`, or `tripay`
- `items` (array, optional): Array of order items
  - `id` (string): Product ID
  - `name` (string): Product name
  - `quantity` (number): Quantity
  - `price` (number): Price per item
- `expiryMinutes` (number, optional): QR code expiry time in minutes (default: 30)
- `metadata` (object, optional): Additional metadata

**Response (Success - 201):**
```json
{
  "success": true,
  "paymentId": "PAY-1700000000-ABC123",
  "orderId": "ORD-1234567890",
  "amount": 50000,
  "gateway": "midtrans",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "qrString": "00020101021226580016ID.CO.QRIS...",
  "expiryTime": "2025-01-15T15:30:00.000Z",
  "paymentUrl": "https://midtrans.com/payment/...",
  "createdAt": "2025-01-15T15:00:00.000Z"
}
```

**Response (Error - 400/409/500):**
```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

---

### 2. Handle Payment Callback

**Endpoint:** `POST /api/payments/qris/callback`

**Description:** Handle payment gateway callback when payment status changes.

**Request Body:**
```json
{
  "gateway": "midtrans",
  "paymentId": "PAY-1700000000-ABC123",
  "orderId": "ORD-1234567890",
  "status": "PAID",
  "transactionId": "txn-1234567890",
  "paidAmount": 50000,
  "paymentMethod": "QRIS",
  "signature": "abc123...",
  "timestamp": "2025-01-15T15:05:00.000Z",
  "metadata": {}
}
```

**Request Parameters:**
- `gateway` (enum, required): Payment gateway - `midtrans`, `xendit`, or `tripay`
- `paymentId` (string, required): Payment ID from create response
- `orderId` (string, required): Order ID
- `status` (enum, required): Payment status - `PENDING`, `PAID`, `EXPIRED`, `FAILED`, or `REFUNDED`
- `transactionId` (string, optional): Gateway transaction ID
- `paidAmount` (number, optional): Amount paid
- `paymentMethod` (string, optional): Payment method used
- `signature` (string, optional): Callback signature for verification
- `timestamp` (string, optional): Callback timestamp
- `metadata` (object, optional): Additional metadata

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Callback processed successfully",
  "paymentId": "PAY-1700000000-ABC123",
  "orderId": "ORD-1234567890",
  "status": "PAID"
}
```

**Response (Error - 400/401/404/500):**
```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

---

### 3. Check Payment Status

**Endpoint:** `GET /api/payments/[id]/status`

**Description:** Check the current status of a payment.

**URL Parameters:**
- `id` (string, required): Payment ID

**Response (Success - 200):**
```json
{
  "success": true,
  "paymentId": "PAY-1700000000-ABC123",
  "orderId": "ORD-1234567890",
  "status": "PAID",
  "amount": 50000,
  "paidAmount": 50000,
  "paymentMethod": "QRIS",
  "transactionId": "txn-1234567890",
  "paidAt": "2025-01-15T15:05:00.000Z",
  "expiryTime": "2025-01-15T15:30:00.000Z",
  "gateway": "midtrans",
  "metadata": {
    "tableNumber": "A1"
  }
}
```

**Response (Error - 400/404/500):**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message"
}
```

**Payment Status Values:**
- `PENDING`: Payment is waiting for customer to scan QR code
- `PAID`: Payment has been successfully completed
- `EXPIRED`: Payment has expired (QR code is no longer valid)
- `FAILED`: Payment failed
- `REFUNDED`: Payment has been refunded

---

### 4. Expire Payment

**Endpoint:** `POST /api/payments/qris/expire`

**Description:** Manually expire a pending QRIS payment.

**Request Body:**
```json
{
  "paymentId": "PAY-1700000000-ABC123",
  "reason": "Customer cancelled order"
}
```

**Request Parameters:**
- `paymentId` (string, required): Payment ID to expire
- `reason` (string, optional): Reason for expiration

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Payment expired successfully",
  "paymentId": "PAY-1700000000-ABC123",
  "orderId": "ORD-1234567890",
  "status": "EXPIRED"
}
```

**Response (Error - 400/404/500):**
```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

---

### 5. Get Payment Information

**Endpoint:** `GET /api/payments`

**Description:** Get payment API information and statistics.

**Query Parameters:**
- `action=gateways`: Get enabled payment gateways
- `action=stats`: Get payment statistics

**Response (Default - 200):**
```json
{
  "success": true,
  "message": "QRIS CPM Payment API",
  "version": "1.0.0",
  "endpoints": {
    "create": { "method": "POST", "path": "/api/payments/qris/create", "description": "..." },
    "callback": { "method": "POST", "path": "/api/payments/qris/callback", "description": "..." },
    "status": { "method": "GET", "path": "/api/payments/[id]/status", "description": "..." },
    "expire": { "method": "POST", "path": "/api/payments/qris/expire", "description": "..." },
    "info": { "method": "GET", "path": "/api/payments?action=gateways", "description": "..." },
    "stats": { "method": "GET", "path": "/api/payments?action=stats", "description": "..." }
  },
  "supportedGateways": ["midtrans", "xendit", "tripay"]
}
```

**Response (Gateways - 200):**
```json
{
  "success": true,
  "data": {
    "gateways": ["midtrans", "xendit", "tripay"],
    "count": 3
  }
}
```

**Response (Stats - 200):**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "pending": 10,
    "paid": 85,
    "expired": 4,
    "failed": 1,
    "totalPaidAmount": 4250000,
    "totalAmount": 5000000
  }
}
```

---

## QRIS CPM Flow

### 1. Create Payment Request
```
POS/System → API → Payment Gateway → QR Code Generation
```
- System sends order details to payment API
- Payment API creates payment with selected gateway
- Gateway generates QR code and returns to system
- System displays QR code to customer

### 2. Customer Scans QR Code
```
Customer → Banking App → Payment Gateway
```
- Customer scans QR code with banking app
- Customer authorizes payment
- Payment is processed

### 3. Payment Gateway Callback
```
Payment Gateway → API Callback → Database Update
```
- Gateway sends callback to API
- API verifies signature
- API updates payment status in database
- API updates related order status

### 4. Status Check
```
POS/System → API → Gateway Status Check (if needed)
```
- System can check payment status
- If pending, API queries gateway
- API returns latest status to system

### 5. Expiration Handling
```
System → API → Gateway Expire
```
- System can manually expire payment
- API notifies gateway
- API updates payment status to EXPIRED

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type/message",
  "details": {},  // For validation errors
  "message": "Detailed error message"  // For other errors
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created (for payment creation)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid signature)
- `404` - Not Found
- `409` - Conflict (duplicate payment)
- `500` - Internal Server Error

---

## Security Features

1. **Signature Verification**: Callback signatures are verified for security
2. **Order ID Validation**: Callback order IDs are verified
3. **Status Validation**: Only pending payments can be expired
4. **Duplicate Callback Handling**: Prevents duplicate payment updates
5. **Transaction Support**: Database operations use transactions for data consistency

---

## Configuration

Payment gateway configurations are managed in `/home/z/my-project/src/lib/payment-gateway.ts`.

**Environment Variables:**
- `MIDTRANS_API_KEY`: Midtrans API key
- `MIDTRANS_API_SECRET`: Midtrans API secret
- `MIDTRANS_MERCHANT_ID`: Midtrans merchant ID
- `XENDIT_API_KEY`: Xendit API key
- `XENDIT_API_SECRET`: Xendit API secret
- `TRIPAY_API_KEY`: Tripay API key
- `TRIPAY_API_SECRET`: Tripay API secret
- `TRIPAY_MERCHANT_ID`: Tripay merchant ID

**Note:** For development/testing, mock values are used.

---

## Integration with Orders System

The payment API integrates with the orders system:

1. When payment status changes, the related order's `paymentStatus` is automatically updated
2. Orders with `paymentMethod: QRIS_CPM` are linked to QRIS payments
3. Order numbers are used as `orderId` in payment creation

---

## Database Schema

**QRISPayment Model:**
- `id`: Unique identifier
- `paymentId`: Payment ID (PAY-XXXXXXXX-XXXXXX)
- `orderId`: Order ID reference
- `gateway`: Payment gateway (MIDTRANS, XENDIT, TRIPAY)
- `amount`: Payment amount
- `customerName`: Customer name
- `customerEmail`: Customer email
- `customerPhone`: Customer phone
- `status`: Payment status (PENDING, PAID, EXPIRED, FAILED, REFUNDED)
- `transactionId`: Gateway transaction ID
- `paidAmount`: Amount actually paid
- `paymentMethod`: Payment method used
- `qrCode`: QR code image (base64)
- `qrString`: QR code string
- `paymentUrl`: Payment URL
- `expiryTime`: QR code expiry time
- `paidAt`: Payment completion time
- `metadata`: Additional metadata (JSON string)
- `callbackReceived`: Whether callback was received
- `callbackAt`: Callback timestamp
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

---

## Testing

### Create a Payment
```bash
curl -X POST http://localhost:3000/api/payments/qris/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "amount": 50000,
    "customerName": "Test Customer",
    "gateway": "midtrans"
  }'
```

### Check Payment Status
```bash
curl http://localhost:3000/api/payments/PAY-1700000000-ABC123/status
```

### Get Payment Statistics
```bash
curl http://localhost:3000/api/payments?action=stats
```

---

## Notes

1. **Mock Implementation**: Currently uses mock payment gateway implementations. Replace with actual gateway SDKs in production.
2. **QR Code Generation**: QR codes are generated as mock data. Use a QR code library (e.g., `qrcode`) for real implementation.
3. **Callback URL**: Configure payment gateways to send callbacks to `/api/payments/qris/callback`.
4. **Expiry Time**: Default expiry is 30 minutes. Can be customized.
5. **Retry Logic**: Implement retry logic for failed gateway calls in production.

---

## Next Steps for Production

1. Replace mock implementations with actual gateway SDKs
2. Implement real QR code generation
3. Configure webhook/callback URLs with payment gateways
4. Add comprehensive logging and monitoring
5. Implement retry logic for failed API calls
6. Add rate limiting to prevent abuse
7. Implement proper error recovery mechanisms
8. Add payment reconciliation jobs
9. Implement refund functionality
10. Add support for partial payments
