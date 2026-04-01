/**
 * WebSocket Client Helper for Broadcasting Events
 *
 * This helper provides a simple interface to broadcast events to the
 * realtime WebSocket service (running on port 3004).
 *
 * If socket.io-client is not installed, the functions will log to console
 * but will not fail the application.
 */

// Try to import socket.io-client dynamically
let io: any = null;
try {
  // Dynamic import to prevent build failures if not installed
  // @ts-ignore - socket.io-client may not be installed
  const { io: socketIOClient } = await import('socket.io-client');
  io = socketIOClient;
} catch (error) {
  console.warn('[WebSocket] socket.io-client not installed. Broadcasting will be logged only.');
  console.warn('[WebSocket] To enable real-time broadcasting, run: bun add socket.io-client');
}

// WebSocket service configuration
const WS_SERVICE_URL = process.env.WS_SERVICE_URL || 'http://localhost:3004';

// Cache socket instance
let socketInstance: any = null;

/**
 * Get or create socket instance
 */
function getSocket() {
  if (!io) {
    return null;
  }

  if (!socketInstance) {
    try {
      socketInstance = io(WS_SERVICE_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });

      socketInstance.on('connect', () => {
        console.log('[WebSocket] Connected to realtime service');
      });

      socketInstance.on('disconnect', () => {
        console.log('[WebSocket] Disconnected from realtime service');
      });

      socketInstance.on('error', (error: any) => {
        console.error('[WebSocket] Error:', error.message);
      });
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      socketInstance = null;
    }
  }

  return socketInstance;
}

/**
 * Broadcast new order event
 */
export function broadcastNewOrder(data: {
  orderId: string;
  orderNumber: string;
  items: any[];
  total: number;
  status: string;
  timestamp: Date;
}): boolean {
  const socket = getSocket();

  if (!socket) {
    console.log(`[WebSocket Mock] Broadcasting new-order: ${data.orderNumber}`);
    return false;
  }

  try {
    socket.emit('new-order', {
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      items: data.items,
      total: data.total,
      status: data.status,
      timestamp: data.timestamp
    });
    console.log(`[WebSocket] Broadcasted new-order: ${data.orderNumber}`);
    return true;
  } catch (error) {
    console.error('[WebSocket] Failed to broadcast new-order:', error);
    return false;
  }
}

/**
 * Broadcast order status update event
 */
export function broadcastOrderUpdated(data: {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}): boolean {
  const socket = getSocket();

  if (!socket) {
    console.log(`[WebSocket Mock] Broadcasting order-updated: ${data.orderNumber} (${data.previousStatus} -> ${data.newStatus})`);
    return false;
  }

  try {
    socket.emit('order-updated', {
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      timestamp: data.timestamp
    });
    console.log(`[WebSocket] Broadcasted order-updated: ${data.orderNumber} (${data.previousStatus} -> ${data.newStatus})`);
    return true;
  } catch (error) {
    console.error('[WebSocket] Failed to broadcast order-updated:', error);
    return false;
  }
}

/**
 * Broadcast new transaction event
 */
export function broadcastNewTransaction(data: {
  transactionId: string;
  transactionNo: string;
  amount: number;
  paymentMethod: string;
  timestamp: Date;
}): boolean {
  const socket = getSocket();

  if (!socket) {
    console.log(`[WebSocket Mock] Broadcasting new-transaction: ${data.transactionNo}`);
    return false;
  }

  try {
    socket.emit('new-transaction', data);
    console.log(`[WebSocket] Broadcasted new-transaction: ${data.transactionNo}`);
    return true;
  } catch (error) {
    console.error('[WebSocket] Failed to broadcast new-transaction:', error);
    return false;
  }
}

/**
 * Broadcast stock alert event
 */
export function broadcastStockAlert(data: {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  timestamp: Date;
}): boolean {
  const socket = getSocket();

  if (!socket) {
    console.log(`[WebSocket Mock] Broadcasting stock-alert: ${data.productName} (${data.currentStock}/${data.minimumStock})`);
    return false;
  }

  try {
    socket.emit('stock-alert', data);
    console.log(`[WebSocket] Broadcasted stock-alert: ${data.productName}`);
    return true;
  } catch (error) {
    console.error('[WebSocket] Failed to broadcast stock-alert:', error);
    return false;
  }
}

/**
 * Broadcast shift update event
 */
export function broadcastShiftUpdated(data: {
  shiftId: string;
  action: 'opened' | 'closed';
  userId: string;
  userName: string;
  timestamp: Date;
}): boolean {
  const socket = getSocket();

  if (!socket) {
    console.log(`[WebSocket Mock] Broadcasting shift-updated: ${data.action} by ${data.userName}`);
    return false;
  }

  try {
    socket.emit('shift-updated', data);
    console.log(`[WebSocket] Broadcasted shift-updated: ${data.action} by ${data.userName}`);
    return true;
  } catch (error) {
    console.error('[WebSocket] Failed to broadcast shift-updated:', error);
    return false;
  }
}

/**
 * Disconnect socket (for cleanup)
 */
export function disconnectWebSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log('[WebSocket] Disconnected from realtime service');
  }
}
