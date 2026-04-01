'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications/queue-service';
import { db as prisma } from '@/lib/db';

/**
 * POST /api/notifications/whatsapp/payment
 * Send payment confirmation to customer
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { orderId, gateway } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
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

    // Check if payment is paid
    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        {
          success: false,
          error: 'Order is not paid yet',
        },
        { status: 400 }
      );
    }

    // Get customer phone
    const customerPhone = order.member?.phone || order.customerPhone;

    if (!customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Customer phone number not found' },
        { status: 400 }
      );
    }

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

    // Prepare template data
    const templateData = {
      customerName: order.member?.name || order.customerName,
      orderNumber: order.orderNumber,
      paymentAmount: order.totalAmount,
      paymentMethod: paymentMethodMap[order.paymentMethod] || order.paymentMethod,
      paymentDate: new Date().toLocaleString('id-ID'),
      storeName: 'AYAM GEPREK SAMBAL IJO',
    };

    // Create notification
    const result = await createNotification({
      type: 'PAYMENT_RECEIVED',
      recipient: customerPhone,
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
      message: 'Payment notification queued successfully',
      notification: result.notification,
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/whatsapp/payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
