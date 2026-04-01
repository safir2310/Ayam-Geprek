'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications/queue-service';
import { db as prisma } from '@/lib/db';

/**
 * POST /api/notifications/whatsapp/order
 * Send order notification to admin/cashier
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { orderId, adminPhone, gateway } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!adminPhone) {
      return NextResponse.json(
        { success: false, error: 'Admin/Cashier phone number is required' },
        { status: 400 }
      );
    }

    // Fetch order details
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

    // Prepare template data
    const templateData = {
      customerName: order.member?.name || order.customerName,
      orderNumber: order.orderNumber,
      orderTotal: order.totalAmount,
      orderItems,
      deliveryAddress: order.customerAddress,
      estimatedTime: '30 menit',
      storeName: 'AYAM GEPREK SAMBAL IJO',
    };

    // Create notification
    const result = await createNotification({
      type: 'ORDER_NEW',
      recipient: adminPhone,
      templateData,
      gateway,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order notification queued successfully',
      notification: result.notification,
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/whatsapp/order:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
