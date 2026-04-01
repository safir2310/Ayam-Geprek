import { Server } from 'socket.io';
import { createServer } from 'node:http';

// Define event types for type safety
interface OrderEvent {
  orderId: string;
  items: any[];
  total: number;
  status: string;
  timestamp: Date;
}

interface OrderUpdatedEvent {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

interface TransactionEvent {
  transactionId: string;
  amount: number;
  paymentMethod: string;
  timestamp: Date;
}

interface StockAlertEvent {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  timestamp: Date;
}

interface ShiftUpdatedEvent {
  shiftId: string;
  action: 'opened' | 'closed';
  userId: string;
  userName: string;
  timestamp: Date;
}

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Port configuration
const PORT = 3004;

// Logging function with timestamp
const logEvent = (event: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${event}`, data ? JSON.stringify(data, null, 2) : '');
};

// Connection handling
io.on('connection', (socket) => {
  logEvent('Connection established', {
    socketId: socket.id,
    connectedClients: io.sockets.sockets.size
  });

  // Handle socket disconnection
  socket.on('disconnect', (reason) => {
    logEvent('Client disconnected', {
      socketId: socket.id,
      reason,
      remainingClients: io.sockets.sockets.size
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    logEvent('Socket error', {
      socketId: socket.id,
      error: error.message
    });
  });

  // ===== Client-side event listeners =====

  // Listen for new order from client
  socket.on('new-order', (data: OrderEvent) => {
    logEvent('New order received', {
      socketId: socket.id,
      orderId: data.orderId,
      total: data.total
    });

    // Broadcast to all connected clients except sender
    socket.broadcast.emit('new-order', data);
  });

  // Listen for order status update from client
  socket.on('order-updated', (data: OrderUpdatedEvent) => {
    logEvent('Order status updated', {
      socketId: socket.id,
      orderId: data.orderId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus
    });

    // Broadcast to all connected clients except sender
    socket.broadcast.emit('order-updated', data);
  });

  // Listen for new POS transaction from client
  socket.on('new-transaction', (data: TransactionEvent) => {
    logEvent('New transaction completed', {
      socketId: socket.id,
      transactionId: data.transactionId,
      amount: data.amount,
      paymentMethod: data.paymentMethod
    });

    // Broadcast to all connected clients except sender
    socket.broadcast.emit('new-transaction', data);
  });

  // Listen for stock alert from client
  socket.on('stock-alert', (data: StockAlertEvent) => {
    logEvent('Stock alert triggered', {
      socketId: socket.id,
      productId: data.productId,
      productName: data.productName,
      currentStock: data.currentStock,
      minimumStock: data.minimumStock
    });

    // Broadcast to all connected clients (including sender for notification)
    io.emit('stock-alert', data);
  });

  // Listen for shift status update from client
  socket.on('shift-updated', (data: ShiftUpdatedEvent) => {
    logEvent('Shift status updated', {
      socketId: socket.id,
      shiftId: data.shiftId,
      action: data.action,
      userId: data.userId,
      userName: data.userName
    });

    // Broadcast to all connected clients except sender
    socket.broadcast.emit('shift-updated', data);
  });

  // Handle room joining (for specific channels)
  socket.on('join-room', (room: string) => {
    socket.join(room);
    logEvent('Client joined room', {
      socketId: socket.id,
      room
    });
  });

  // Handle room leaving
  socket.on('leave-room', (room: string) => {
    socket.leave(room);
    logEvent('Client left room', {
      socketId: socket.id,
      room
    });
  });

  // Handle custom events (for future extensibility)
  socket.on('custom-event', (data: any) => {
    logEvent('Custom event received', {
      socketId: socket.id,
      event: data.event,
      data: data.payload
    });

    // Echo back to all clients
    io.emit('custom-event', data);
  });
});

// Server-side helper functions to emit events
// These can be imported and used by other services

export const emitNewOrder = (data: OrderEvent) => {
  logEvent('Server: Broadcasting new order', data);
  io.emit('new-order', data);
};

export const emitOrderUpdated = (data: OrderUpdatedEvent) => {
  logEvent('Server: Broadcasting order update', data);
  io.emit('order-updated', data);
};

export const emitNewTransaction = (data: TransactionEvent) => {
  logEvent('Server: Broadcasting new transaction', data);
  io.emit('new-transaction', data);
};

export const emitStockAlert = (data: StockAlertEvent) => {
  logEvent('Server: Broadcasting stock alert', data);
  io.emit('stock-alert', data);
};

export const emitShiftUpdated = (data: ShiftUpdatedEvent) => {
  logEvent('Server: Broadcasting shift update', data);
  io.emit('shift-updated', data);
};

// Start server
httpServer.listen(PORT, () => {
  logEvent('Realtime Service Started', {
    port: PORT,
    message: 'WebSocket server is running and ready for connections'
  });
});

// Graceful shutdown handling
const shutdown = () => {
  logEvent('Shutdown initiated', {
    message: 'Closing WebSocket server gracefully...'
  });

  io.close(() => {
    httpServer.close(() => {
      logEvent('Server shutdown complete', {
        message: 'All connections closed, server stopped'
      });
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logEvent('Forced shutdown', {
      message: 'Server did not close gracefully, forcing exit'
    });
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Export io instance for external use if needed
export { io };
export default io;
