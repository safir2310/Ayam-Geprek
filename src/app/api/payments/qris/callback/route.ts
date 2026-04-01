'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { paymentGatewayService } from '@/lib/payment-gateway';
import { PaymentCallbackRequest, PaymentStatus } from '@/types/payment';
import { z } from 'zod';

/**
 * Validation schema for payment callback
 */
const paymentCallbackSchema = z.object({
  gateway: z.enum(['midtrans', 'xendit', 'tripay']),
  paymentId: z.string().min(1, 'Payment ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum(['PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED']),
  transactionId: z.string().optional(),
  paidAmount: z.number().nonnegative().optional(),
  paymentMethod: z.string().optional(),
  signature: z.string().optional(),
  timestamp: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/payments/qris/callback
 * Handle payment gateway callback
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = paymentCallbackSchema.parse(body);

    const {
      gateway,
      paymentId,
      orderId,
      status,
      transactionId,
      paidAmount,
      paymentMethod,
      signature,
      timestamp,
      metadata,
    } = validatedData;

    console.log(`[Payment Callback] Received callback from ${gateway}`);
    console.log(`[Payment Callback] Payment ID: ${paymentId}, Order ID: ${orderId}, Status: ${status}`);

    // Verify signature if provided
    if (signature) {
      const isValid = paymentGatewayService.verifyCallbackSignature(gateway, signature, body);
      if (!isValid) {
        console.error('[Payment Callback] Invalid signature');
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid signature',
          },
          { status: 401 }
        );
      }
    }

    // Find the payment record
    const payment = await prisma.qRISPayment.findUnique({
      where: { paymentId },
    });

    if (!payment) {
      console.error(`[Payment Callback] Payment not found: ${paymentId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment not found',
        },
        { status: 404 }
      );
    }

    // Verify order ID matches
    if (payment.orderId !== orderId) {
      console.error(`[Payment Callback] Order ID mismatch. Expected: ${payment.orderId}, Received: ${orderId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID mismatch',
        },
        { status: 400 }
      );
    }

    // Check if callback has already been processed for paid status
    if (payment.status === 'PAID' && status === 'PAID') {
      console.log(`[Payment Callback] Payment already marked as PAID, skipping duplicate callback`);
      return NextResponse.json({
        success: true,
        message: 'Callback processed successfully (duplicate)',
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        status: payment.status,
      });
    }

    // Update payment status
    const updateData: any = {
      status: status as PaymentStatus,
      callbackReceived: true,
      callbackAt: new Date(),
      updatedAt: new Date(),
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (status === 'PAID') {
      updateData.paidAt = new Date();
    }

    // Update payment record
    const updatedPayment = await prisma.qRISPayment.update({
      where: { paymentId },
      data: updateData,
    });

    console.log(`[Payment Callback] Payment updated successfully: ${paymentId} -> ${status}`);

    // Update order payment status if exists
    try {
      const order = await prisma.order.findUnique({
        where: { orderNumber: orderId },
      });

      if (order && order.paymentMethod === 'QRIS_CPM') {
        await prisma.order.update({
          where: { orderNumber: orderId },
          data: {
            paymentStatus: status as any,
          },
        });
        console.log(`[Payment Callback] Order payment status updated: ${orderId} -> ${status}`);
      }
    } catch (orderError) {
      console.error('[Payment Callback] Failed to update order:', orderError);
      // Don't fail the callback if order update fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Callback processed successfully',
      paymentId: updatedPayment.paymentId,
      orderId: updatedPayment.orderId,
      status: updatedPayment.status,
    });
  } catch (error) {
    console.error('[Payment Callback] Error:', error);

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
