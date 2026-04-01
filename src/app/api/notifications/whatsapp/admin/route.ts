'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications/queue-service';
import { db as prisma } from '@/lib/db';

/**
 * POST /api/notifications/whatsapp/admin
 * Send various types of notifications to admin/cashier
 * Supports: order notifications, stock alerts, and custom messages
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { type, adminPhone, orderId, productId, customMessage } = body;

    if (!adminPhone) {
      return NextResponse.json(
        { success: false, error: 'Admin/Cashier phone number is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Notification type is required' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = [
      'ORDER_NEW',
      'ORDER_CONFIRMED',
      'ORDER_COMPLETED',
      'PAYMENT_RECEIVED',
      'STOCK_LOW',
      'STOCK_EMPTY',
      'CUSTOM',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    let templateData: any = {};
    let message: string = '';

    // Handle different notification types
    switch (type) {
      case 'ORDER_NEW':
      case 'ORDER_CONFIRMED':
      case 'ORDER_COMPLETED':
      case 'PAYMENT_RECEIVED': {
        // Order-related notifications
        if (!orderId) {
          return NextResponse.json(
            { success: false, error: 'Order ID is required for order notifications' },
            { status: 400 }
          );
        }

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            member: true,
          },
        });

        if (!order) {
          return NextResponse.json(
            { success: false, error: 'Order not found' },
            { status: 404 }
          );
        }

        // Build order items string
        const orderItems = order.items
          .map(
            (item) =>
              `• ${item.product.name} x${item.quantity} - Rp ${item.subtotal.toLocaleString('id-ID')}`
          )
          .join('\n');

        // Payment method mapping
        const paymentMethodMap: Record<string, string> = {
          CASH: 'Tunai',
          QRIS_CPM: 'QRIS',
          DEBIT: 'Kartu Debit',
          CREDIT: 'Kartu Kredit',
          TRANSFER: 'Transfer Bank',
          E_WALLET: 'E-Wallet',
          SPLIT: 'Pembayaran Terbagi',
        };

        templateData = {
          customerName: order.member?.name || order.customerName,
          orderNumber: order.orderNumber,
          orderTotal: order.totalAmount,
          orderItems,
          deliveryAddress: order.customerAddress,
          estimatedTime: '30 menit',
          storeName: 'AYAM GEPREK SAMBAL IJO',
          paymentMethod: paymentMethodMap[order.paymentMethod] || order.paymentMethod,
          paymentAmount: order.totalAmount,
          paymentDate: new Date().toLocaleString('id-ID'),
        };

        break;
      }

      case 'STOCK_LOW':
      case 'STOCK_EMPTY': {
        // Stock-related notifications
        if (!productId) {
          return NextResponse.json(
            { success: false, error: 'Product ID is required for stock notifications' },
            { status: 400 }
          );
        }

        const product = await prisma.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          return NextResponse.json(
            { success: false, error: 'Product not found' },
            { status: 404 }
          );
        }

        templateData = {
          productName: product.name,
          currentStock: product.stock,
          minStock: product.minStock,
          storeName: 'AYAM GEPREK SAMBAL IJO',
        };

        break;
      }

      case 'CUSTOM': {
        // Custom message
        if (!customMessage) {
          return NextResponse.json(
            { success: false, error: 'Custom message is required for CUSTOM notification type' },
            { status: 400 }
          );
        }

        templateData = {
          customMessage,
          storeName: 'AYAM GEPREK SAMBAL IJO',
        };

        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported notification type' },
          { status: 400 }
        );
    }

    // Create notification
    const result = await createNotification({
      type: type as any,
      recipient: adminPhone,
      templateData,
      customMessage: type === 'CUSTOM' ? customMessage : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin notification queued successfully',
      notification: result.notification,
      type,
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/whatsapp/admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
