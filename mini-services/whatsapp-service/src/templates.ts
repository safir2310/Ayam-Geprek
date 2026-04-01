import type { OrderData, PaymentData, OrderStatus } from './types.js';

export class MessageTemplates {
  // New order notification for admin/cashier
  static newOrderNotification(order: OrderData): string {
    const itemsList = order.items
      .map(item => `• ${item.name} x${item.quantity} - Rp ${item.price * item.quantity.toLocaleString('id-ID')}`)
      .join('\n');

    return `🔔 *PESANAN BARU*

ID: #${order.orderId}
Pelanggan: ${order.customerName}
WhatsApp: ${order.customerPhone}
Tipe: ${order.orderType || 'Dine In'}

*Item Pesanan:*
${itemsList}

*Total: Rp ${order.totalAmount.toLocaleString('id-ID')}*
Metode Pembayaran: ${order.paymentMethod || 'QRIS'}

Segera konfirmasi pesanan ini!`;
  }

  // Order confirmation to customer
  static orderConfirmation(order: OrderData): string {
    const itemsList = order.items
      .map(item => `• ${item.name} x${item.quantity} - Rp ${item.price * item.quantity.toLocaleString('id-ID')}`)
      .join('\n');

    return `✅ *PESANAN DITERIMA*

Terima kasih ${order.customerName}!

*ID Pesanan:* #${order.orderId}
*Estimasi Waktu:* ${order.estimatedTime ? order.estimatedTime + ' menit' : 'Sedang diproses'}

*Item Pesanan:*
${itemsList}

*Total: Rp ${order.totalAmount.toLocaleString('id-ID')}*

Pesanan Anda sedang kami proses. Kami akan memberi tahu saat pesanan siap! 🍗

_AYAM GEPREK SAMBAL IJO_`;
  }

  // Order status update to customer
  static orderStatusUpdate(orderId: string, status: OrderStatus, estimatedTime?: number): string {
    const statusMessages: Record<OrderStatus, { emoji: string; message: string }> = {
      pending: { emoji: '⏳', message: 'Menunggu konfirmasi' },
      confirmed: { emoji: '✅', message: 'Pesanan dikonfirmasi' },
      processing: { emoji: '👨‍🍳', message: 'Sedang diproses' },
      completed: { emoji: '🎉', message: 'Pesanan selesai' },
      cancelled: { emoji: '❌', message: 'Pesanan dibatalkan' },
      ready: { emoji: '📦', message: 'Pesanan siap diambil' }
    };

    const { emoji, message } = statusMessages[status];
    const timeInfo = estimatedTime ? `\n*Estimasi Waktu:* ${estimatedTime} menit` : '';

    return `${emoji} *STATUS PESANAN*

*ID Pesanan:* #${orderId}
*Status:* ${message}${timeInfo}

_AYAM GEPREK SAMBAL IJO_`;
  }

  // Payment confirmation
  static paymentConfirmation(payment: PaymentData): string {
    return `💳 *PEMBAYARAN DITERIMA*

Terima kasih, ${payment.customerName}!

*ID Pesanan:* #${payment.orderId}
*Jumlah:* Rp ${payment.amount.toLocaleString('id-ID')}
*Metode:* ${payment.paymentMethod}
${payment.transactionId ? `*ID Transaksi:* ${payment.transactionId}` : ''}

Pembayaran Anda telah berhasil dikonfirmasi. Pesanan akan segera diproses! 🍗

_AYAM GEPREK SAMBAL IJO_`;
  }

  // Promotional message
  static promotionalMessage(title: string, content: string, promoCode?: string, validUntil?: string): string {
    let message = `🎉 ${title}

${content}

`;

    if (promoCode) {
      message += `*Kode Promo:* ${promoCode}\n`;
    }

    if (validUntil) {
      message += `*Berlaku sampai:* ${validUntil}\n`;
    }

    message += `\n_AYAM GEPREK SAMBAL IJO_`;

    return message;
  }

  // Custom message
  static customMessage(to: string, message: string): string {
    return message;
  }
}
