# Realtime Service

WebSocket service for AYAM GEPREK SAMBAL IJO restaurant system. Provides real-time updates for orders, transactions, stock alerts, and shift management.

## Features

- Real-time bidirectional communication using Socket.IO
- Event broadcasting for:
  - New orders
  - Order status updates
  - POS transactions
  - Stock alerts
  - Shift management
- Connection/Disconnection handling with logging
- Room-based messaging support
- Hot reload support with `bun --hot`
- Auto-restart on file changes
- Comprehensive event logging for debugging

## Installation

```bash
cd /home/z/my-project/mini-services/realtime-service
bun install
```

## Usage

### Start the service (Development)

```bash
bun run dev
```

This starts the service with hot reload enabled. The server will auto-restart on file changes.

### Start the service (Production)

```bash
bun start
```

## Server Details

- **Port:** 3004
- **Protocol:** WebSocket + HTTP polling
- **CORS:** Enabled for all origins (configure as needed)

## Events

### Server → Client Events

These are broadcast events that clients can listen to:

#### `new-order`

Emitted when a new online order is received.

```typescript
{
  orderId: string;
  items: any[];
  total: number;
  status: string;
  timestamp: Date;
}
```

#### `order-updated`

Emitted when an order status changes.

```typescript
{
  orderId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}
```

#### `new-transaction`

Emitted when a POS transaction is completed.

```typescript
{
  transactionId: string;
  amount: number;
  paymentMethod: string;
  timestamp: Date;
}
```

#### `stock-alert`

Emitted when a product's stock is below minimum threshold.

```typescript
{
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  timestamp: Date;
}
```

#### `shift-updated`

Emitted when a shift is opened or closed.

```typescript
{
  shiftId: string;
  action: 'opened' | 'closed';
  userId: string;
  userName: string;
  timestamp: Date;
}
```

### Client → Server Events

Clients can emit these events to the server:

#### `new-order`
Send a new order to be broadcast to all other clients.

#### `order-updated`
Send an order status update to be broadcast.

#### `new-transaction`
Send a new transaction to be broadcast.

#### `stock-alert`
Send a stock alert to be broadcast.

#### `shift-updated`
Send a shift update to be broadcast.

#### `join-room`
Join a specific room for targeted messaging.

```typescript
socket.emit('join-room', 'orders');
```

#### `leave-room`
Leave a specific room.

```typescript
socket.emit('leave-room', 'orders');
```

## Client Implementation Example

### Using Socket.IO Client

```typescript
import { io, Socket } from 'socket.io-client';

// Connect to the realtime service
const socket: Socket = io('http://localhost:3004');

// Listen for new orders
socket.on('new-order', (order) => {
  console.log('New order received:', order);
  // Handle new order notification
});

// Listen for order updates
socket.on('order-updated', (update) => {
  console.log('Order updated:', update);
  // Handle order status change
});

// Listen for new transactions
socket.on('new-transaction', (transaction) => {
  console.log('New transaction:', transaction);
  // Handle transaction notification
});

// Listen for stock alerts
socket.on('stock-alert', (alert) => {
  console.log('Stock alert:', alert);
  // Show low stock warning
});

// Listen for shift updates
socket.on('shift-updated', (shift) => {
  console.log('Shift updated:', shift);
  // Handle shift status change
});

// Emit a new order
socket.emit('new-order', {
  orderId: 'ORD-123',
  items: [{ id: 1, name: 'Ayam Geprek', quantity: 2 }],
  total: 40000,
  status: 'pending',
  timestamp: new Date()
});

// Join a room
socket.emit('join-room', 'kitchen');

// Disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useRealtimeService = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:3004');

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Connected to realtime service');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from realtime service');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const emitNewOrder = (order: any) => {
    if (socket) {
      socket.emit('new-order', order);
    }
  };

  return { socket, connected, emitNewOrder };
};
```

## Server-Side Helper Functions

If you need to emit events from the server side (e.g., from another service), you can import and use the helper functions:

```typescript
import { emitNewOrder, emitOrderUpdated, emitNewTransaction, emitStockAlert, emitShiftUpdated } from './index';

// Emit new order from server
emitNewOrder({
  orderId: 'ORD-123',
  items: [],
  total: 50000,
  status: 'pending',
  timestamp: new Date()
});

// Emit stock alert from server
emitStockAlert({
  productId: 'PROD-456',
  productName: 'Ayam Potong',
  currentStock: 5,
  minimumStock: 10,
  timestamp: new Date()
});
```

## Logging

All events are logged with timestamps for debugging. Logs include:

- Connection/Disconnection events
- All event emissions and receptions
- Error events
- Server startup/shutdown

Example log output:
```
[2024-01-15T10:30:45.123Z] Realtime Service Started { port: 3004, message: 'WebSocket server is running...' }
[2024-01-15T10:31:00.456Z] Connection established { socketId: 'abc123', connectedClients: 1 }
[2024-01-15T10:31:05.789Z] New order received { socketId: 'abc123', orderId: 'ORD-123', total: 40000 }
```

## Architecture

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│   POS System    │ ◄──────────────────────►  │  Realtime       │
│                 │                            │  Service        │
└─────────────────┘                            │  (Port 3004)    │
                                               └─────────┬───────┘
┌─────────────────┐                                    │
│  Online Order   │ ◄───────────────────────────────────┤
│     System      │                                    │
└─────────────────┘                                    │
┌─────────────────┐                                    │
│   Admin Panel   │ ◄───────────────────────────────────┤
│                 │                                    │
└─────────────────┘                                    │
┌─────────────────┐                                    │
│   Kitchen View  │ ◄───────────────────────────────────┤
│                 │                                    │
└─────────────────┘                                    │
```

## Environment Variables (Optional)

Create a `.env` file in the service directory:

```env
PORT=3004
NODE_ENV=development
```

## Troubleshooting

### Service won't start
- Ensure port 3004 is not already in use
- Check that all dependencies are installed: `bun install`

### Clients cannot connect
- Verify the service is running on port 3004
- Check firewall settings
- Ensure CORS is configured correctly for your client origin

### Events not being received
- Check the server logs for event emissions
- Verify client is listening for the correct event names
- Ensure socket is connected before emitting events

## Development

### Adding New Events

1. Define the event interface in `index.ts`
2. Add the socket event listener
3. Update this README with the new event documentation

Example:
```typescript
interface NewEvent {
  id: string;
  data: any;
}

socket.on('new-event', (data: NewEvent) => {
  logEvent('New event received', data);
  socket.broadcast.emit('new-event', data);
});
```

## License

Part of the AYAM GEPREK SAMBAL IJO restaurant system.
