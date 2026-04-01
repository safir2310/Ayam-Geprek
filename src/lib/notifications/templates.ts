/**
 * WhatsApp Message Templates
 * Pre-defined templates for different notification types
 */

export interface MessageTemplateData {
  // Common fields
  customerName?: string;
  orderNumber?: string;
  storeName?: string;

  // Order-specific fields
  orderTotal?: number;
  orderItems?: string;
  deliveryAddress?: string;
  estimatedTime?: string;

  // Payment-specific fields
  paymentMethod?: string;
  paymentAmount?: number;
  paymentDate?: string;

  // Stock-specific fields
  productName?: string;
  currentStock?: number;
  minStock?: number;

  // Custom message
  customMessage?: string;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format phone number
function formatPhoneNumber(phone: string): string {
  // Convert 08xx to 628xx
  if (phone.startsWith('08')) {
    return '62' + phone.substring(1);
  }
  return phone;
}

// Template 1: New Order Notification (to Admin/Cashier)
export function newOrderTemplate(data: MessageTemplateData): string {
  const storeName = data.storeName || 'AYAM GEPREK SAMBAL IJO';
  const orderNumber = data.orderNumber || 'N/A';
  const customerName = data.customerName || 'Pelanggan';
  const orderTotal = data.orderTotal || 0;
  const orderItems = data.orderItems || '-';
  const deliveryAddress = data.deliveryAddress || 'Dine-in';
  const estimatedTime = data.estimatedTime || '30 menit';

  return `🔔 *PESANAN BARU*
🏪 ${storeName}

📋 No. Pesanan: ${orderNumber}
👤 Nama: ${customerName}
📍 Alamat: ${deliveryAddress}

🍽️ *Detail Pesanan:*
${orderItems}

💰 *Total:* ${formatCurrency(orderTotal)}
⏱️ Estimasi: ${estimatedTime}

⚠️ Segera konfirmasi pesanan ini!`;
}

// Template 2: Order Confirmed Notification (to Customer)
export function orderConfirmedTemplate(data: MessageTemplateData): string {
  const storeName = data.storeName || 'AYAM GEPREK SAMBAL IJO';
  const orderNumber = data.orderNumber || 'N/A';
  const customerName = data.customerName || 'Pelanggan';
  const estimatedTime = data.estimatedTime || '30 menit';

  return `✅ *PESANAN DIKONFIRMASI*
🏪 ${storeName}

Halo, ${customerName}! 👋

Pesanan Anda telah dikonfirmasi:
📋 No. Pesanan: ${orderNumber}
⏱️ Estimasi Waktu: ${estimatedTime}

Pesanan Anda sedang kami siapkan dengan hati-hati. 
Kami akan menginformasikan ketika pesanan siap diantar.

Terima kasih telah memesan di ${storeName}! 🍗🌶️`;
}

// Template 3: Order Completed Notification (to Customer)
export function orderCompletedTemplate(data: MessageTemplateData): string {
  const storeName = data.storeName || 'AYAM GEPREK SAMBAL IJO';
  const orderNumber = data.orderNumber || 'N/A';
  const customerName = data.customerName || 'Pelanggan';

  return `🎉 *PESANAN SELESAI*
🏪 ${storeName}

Halo, ${customerName}! 👋

Pesanan Anda telah selesai:
📋 No. Pesanan: ${orderNumber}
✨ Status: Selesai

Selamat menikmati hidangan kami! 
Jangan lupa untuk memesan lagi ya.

Terima kasih telah memesan di ${storeName}! 🍗🌶️`;
}

// Template 4: Payment Received Notification (to Customer)
export function paymentReceivedTemplate(data: MessageTemplateData): string {
  const storeName = data.storeName || 'AYAM GEPREK SAMBAL IJO';
  const orderNumber = data.orderNumber || 'N/A';
  const customerName = data.customerName || 'Pelanggan';
  const paymentAmount = data.paymentAmount || 0;
  const paymentMethod = data.paymentMethod || 'Transfer';
  const paymentDate = data.paymentDate || new Date().toLocaleString('id-ID');

  return `💳 *PEMBAYARAN DITERIMA*
🏪 ${storeName}

Halo, ${customerName}! 👋

Pembayaran Anda telah kami terima:
📋 No. Pesanan: ${orderNumber}
💰 Jumlah: ${formatCurrency(paymentAmount)}
🏦 Metode: ${paymentMethod}
📅 Tanggal: ${paymentDate}

Pesanan Anda sedang diproses.
Selamat menikmati hidangan kami! 🍗🌶️

Terima kasih!`;
}

// Template 5: Low Stock Alert (to Admin)
export function lowStockTemplate(data: MessageTemplateData): string {
  const storeName = data.storeName || 'AYAM GEPREK SAMBAL IJO';
  const productName = data.productName || 'Produk';
  const currentStock = data.currentStock || 0;
  const minStock = data.minStock || 5;

  return `⚠️ *STOK MENIPIS*
🏪 ${storeName}

Perhatian! Stok produk menipis:

📦 Produk: ${productName}
📊 Stok Saat Ini: ${currentStock}
📉 Minimum Stok: ${minStock}
⚡ Sisa: ${currentStock - minStock}

Segera lakukan restok untuk menghindari kehabisan stok!

Hubungi supplier atau perbarui stok di sistem.`;
}

// Template 6: Empty Stock Alert (to Admin)
export function emptyStockTemplate(data: MessageTemplateData): string {
  const storeName = data.storeName || 'AYAM GEPREK SAMBAL IJO';
  const productName = data.productName || 'Produk';

  return `🚨 *STOK HABIS*
🏪 ${storeName}

PERINGATAN KRITIS! Stok produk habis:

📦 Produk: ${productName}
📊 Stok: 0
🚫 Produk tidak dapat dipesan!

Segera lakukan restok segera mungkin!

Hubungi supplier atau perbarui stok di sistem.`;
}

// Template 7: Custom Message
export function customTemplate(data: MessageTemplateData): string {
  return data.customMessage || 'Tidak ada pesan';
}

// Template selector based on notification type
export function getTemplate(
  type: string,
  data: MessageTemplateData
): string {
  switch (type) {
    case 'ORDER_NEW':
      return newOrderTemplate(data);
    case 'ORDER_CONFIRMED':
      return orderConfirmedTemplate(data);
    case 'ORDER_COMPLETED':
      return orderCompletedTemplate(data);
    case 'PAYMENT_RECEIVED':
      return paymentReceivedTemplate(data);
    case 'STOCK_LOW':
      return lowStockTemplate(data);
    case 'STOCK_EMPTY':
      return emptyStockTemplate(data);
    case 'CUSTOM':
      return customTemplate(data);
    default:
      return customTemplate(data);
  }
}
