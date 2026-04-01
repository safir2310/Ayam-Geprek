'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { paymentGatewayService } from '@/lib/payment-gateway';
import { z } from 'zod';

/**
 * Validation schema for expiring payment
 */
const expirePaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  reason: z.string().optional(),
});

/**
 * POST /api/payments/qris/expire
 * Expire a pending QRIS payment
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = expirePaymentSchema.parse(body);

    const { paymentId, reason } = validatedData;

    console.log(`[Payment Expire] Expiring payment: ${paymentId}`);

    // Find payment in database
    const payment = await prisma.qRISPayment.findUnique({
      where: { paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment not found',
        },
        { status: 404 }
      );
    }

    // Check if payment can be expired (must be PENDING)
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: `Payment cannot be expired. Current status: ${payment.status}`,
        },
        { status: 400 }
      );
    }

    // Convert gateway to lowercase for service
    const gatewayLower = payment.gateway.toLowerCase() as any;

    // Expire payment at gateway if transaction ID exists
    if (payment.transactionId) {
      try {
        await paymentGatewayService.expirePayment(gatewayLower, payment.transactionId);
        console.log(`[Payment Expire] Payment expired at gateway: ${payment.transactionId}`);
      } catch (gatewayError) {
        console.error('[Payment Expire] Gateway expire failed:', gatewayError);
        // Continue with database update even if gateway fails
      }
    }

    // Update payment status to EXPIRED
    const expiredPayment = await prisma.qRISPayment.update({
      where: { paymentId },
      data: {
        status: 'EXPIRED',
        metadata: reason
          ? JSON.stringify({
              ...(payment.metadata ? JSON.parse(payment.metadata) : {}),
              expireReason: reason,
            })
          : payment.metadata,
        updatedAt: new Date(),
      },
    });

    // Also update order payment status if exists
    try {
      const order = await prisma.order.findUnique({
        where: { orderNumber: payment.orderId },
      });

      if (order && order.paymentMethod === 'QRIS_CPM') {
        await prisma.order.update({
          where: { orderNumber: payment.orderId },
          data: {
            paymentStatus: 'EXPIRED',
          },
        });
        console.log(`[Payment Expire] Order payment status updated: ${payment.orderId}`);
      }
    } catch (orderError) {
      console.error('[Payment Expire] Failed to update order:', orderError);
      // Don't fail the expire if order update fails
    }

    console.log(`[Payment Expire] Payment expired successfully: ${paymentId}`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Payment expired successfully',
      paymentId: expiredPayment.paymentId,
      orderId: expiredPayment.orderId,
      status: 'EXPIRED',
    });
  } catch (error) {
    console.error('[Payment Expire] Error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
