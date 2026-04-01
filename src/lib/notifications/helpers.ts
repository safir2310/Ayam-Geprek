import { createNotification } from './queue-service';
import { db } from '@/lib/db';

/**
 * Helper functions for common notification scenarios
 */

/**
 * Send new order notification to admin/cashier
 */
export async function notifyNewOrder(orderId: string, adminPhone: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
        member: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const orderItems = order.items
      .map(
        (item) =>
          `• ${item.product.name} x${item.quantity} - Rp ${item.subtotal.toLocaleString('id-ID')}`
      )
      .join('\n');

    const templateData = {
      customerName: order.member?.name || order.customerName,
      orderNumber: order.orderNumber,
      orderTotal: order.totalAmount,
      orderItems,
      deliveryAddress: order.customerAddress,
      estimatedTime: '30 menit',
      storeName: 'AYAM GEPREK SAMBAL IJO',
    };

    return await createNotification({
      type: 'ORDER_NEW',
      recipient: adminPhone,
      templateData,
    });
  } catch (error) {
    console.error('Error in notifyNewOrder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send order confirmed notification to customer
 */
export async function notifyOrderConfirmed(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { member: true },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const customerPhone = order.member?.phone || order.customerPhone;

    if (!customerPhone) {
      return { success: false, error: 'Customer phone not found' };
    }

    const templateData = {
      customerName: order.member?.name || order.customerName,
      orderNumber: order.orderNumber,
      estimatedTime: '30 menit',
      storeName: 'AYAM GEPREK SAMBAL IJO',
    };

    return await createNotification({
      type: 'ORDER_CONFIRMED',
      recipient: customerPhone,
      templateData,
    });
  } catch (error) {
    console.error('Error in notifyOrderConfirmed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send order completed notification to customer
 */
export async function notifyOrderCompleted(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { member: true },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const customerPhone = order.member?.phone || order.customerPhone;

    if (!customerPhone) {
      return { success: false, error: 'Customer phone not found' };
    }

    const templateData = {
      customerName: order.member?.name || order.customerName,
      orderNumber: order.orderNumber,
      storeName: 'AYAM GEPREK SAMBAL IJO',
    };

    return await createNotification({
      type: 'ORDER_COMPLETED',
      recipient: customerPhone,
      templateData,
    });
  } catch (error) {
    console.error('Error in notifyOrderCompleted:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send payment received notification to customer
 */
export async function notifyPaymentReceived(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { member: true },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.paymentStatus !== 'PAID') {
      return { success: false, error: 'Order is not paid yet' };
    }

    const customerPhone = order.member?.phone || order.customerPhone;

    if (!customerPhone) {
      return { success: false, error: 'Customer phone not found' };
    }

    const paymentMethodMap: Record<string, string> = {
      CASH: 'Tunai',
      QRIS_CPM: 'QRIS',
      DEBIT: 'Kartu Debit',
      CREDIT: 'Kartu Kredit',
      TRANSFER: 'Transfer Bank',
      E_WALLET: 'E-Wallet',
      SPLIT: 'Pembayaran Terbagi',
    };

    const templateData = {
      customerName: order.member?.name || order.customerName,
      orderNumber: order.orderNumber,
      paymentAmount: order.totalAmount,
      paymentMethod: paymentMethodMap[order.paymentMethod] || order.paymentMethod,
      paymentDate: new Date().toLocaleString('id-ID'),
      storeName: 'AYAM GEPREK SAMBAL IJO',
    };

    return await createNotification({
      type: 'PAYMENT_RECEIVED',
      recipient: customerPhone,
      templateData,
    });
  } catch (error) {
    console.error('Error in notifyPaymentReceived:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send low stock alert to admin
 */
export async function notifyLowStock(productId: string, adminPhone: string) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const templateData = {
      productName: product.name,
      currentStock: product.stock,
      minStock: product.minStock,
      storeName: 'AYAM GEPREK SAMBAL IJO',
    };

    return await createNotification({
      type: 'STOCK_LOW',
      recipient: adminPhone,
      templateData,
    });
  } catch (error) {
    console.error('Error in notifyLowStock:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send empty stock alert to admin
 */
export async function notifyEmptyStock(productId: string, adminPhone: string) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const templateData = {
      productName: product.name,
      storeName: 'AYAM GEPREK SAMBAL IJO',
    };

    return await createNotification({
      type: 'STOCK_EMPTY',
      recipient: adminPhone,
      templateData,
    });
  } catch (error) {
    console.error('Error in notifyEmptyStock:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send custom notification
 */
export async function sendCustomNotification(
  recipient: string,
  message: string,
  gateway?: 'fonnte' | 'wablas' | 'twilio'
) {
  return await createNotification({
    type: 'ORDER_NEW', // Use default type for custom messages
    recipient,
    customMessage: message,
    gateway,
  });
}
