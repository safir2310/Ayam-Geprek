'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { paymentGatewayService } from '@/lib/payment-gateway';
import { z } from 'zod';

/**
 * Validation schema for cancel payment
 */
const cancelPaymentSchema = z.object({
  reason: z.string().min(1, 'Cancel reason is required').max(500, 'Reason must be less than 500 characters'),
});

/**
 * POST /api/payments/qris/cancel/[paymentId]
 * Cancel a QRIS payment
 *
 * This endpoint:
 * 1. Validates that the payment exists
 * 2. Checks if payment can be cancelled (must be PENDING)
 * 3. Attempts to cancel payment at the gateway
 * 4. Updates payment status to FAILED in database
 * 5. Updates associated order payment status if exists
 *
 * @param paymentId - The payment ID to cancel
 * @param body - Cancel reason
 * @returns Success or error response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Validate payment ID
    if (!paymentId || paymentId.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment ID is required',
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = cancelPaymentSchema.parse(body);

    const { reason } = validatedData;

    console.log(`[QRIS Payment Cancel] Cancelling payment: ${paymentId}`);
    console.log(`[QRIS Payment Cancel] Reason: ${reason}`);

    // Find payment in database
    const payment = await prisma.qRISPayment.findUnique({
      where: { paymentId },
    });

    if (!payment) {
      console.error(`[QRIS Payment Cancel] Payment not found: ${paymentId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment not found',
        },
        { status: 404 }
      );
    }

    // Check if payment can be cancelled (must be PENDING)
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: `Payment cannot be cancelled. Current status: ${payment.status}`,
          message: 'Only pending payments can be cancelled',
        },
        { status: 400 }
      );
    }

    // Convert gateway to lowercase for service
    const gatewayLower = payment.gateway.toLowerCase() as 'midtrans' | 'xendit' | 'tripay';

    // Attempt to cancel payment at gateway if transaction ID exists
    let gatewayCancelled = false;
    if (payment.transactionId) {
      try {
        // Note: Most payment gateways don't have a direct "cancel" endpoint
        // Usually, we would expire the payment instead
        const expireResult = await paymentGatewayService.expirePayment(
          gatewayLower,
          payment.transactionId
        );

        if (expireResult) {
          gatewayCancelled = true;
          console.log(`[QRIS Payment Cancel] Payment cancelled/expired at gateway: ${payment.transactionId}`);
        }
      } catch (gatewayError) {
        console.error('[QRIS Payment Cancel] Gateway cancel failed:', gatewayError);
        // Continue with database update even if gateway fails
      }
    }

    // Parse existing metadata if exists
    let existingMetadata = {};
    if (payment.metadata) {
      try {
        existingMetadata = JSON.parse(payment.metadata);
      } catch (parseError) {
        console.error('[QRIS Payment Cancel] Failed to parse existing metadata:', parseError);
      }
    }

    // Update payment status to FAILED with cancel reason
    const cancelledPayment = await prisma.qRISPayment.update({
      where: { paymentId },
      data: {
        status: 'FAILED',
        metadata: JSON.stringify({
          ...existingMetadata,
          cancelledAt: new Date().toISOString(),
          cancelReason: reason,
          gatewayCancelled: gatewayCancelled,
        }),
        updatedAt: new Date(),
      },
    });

    console.log(`[QRIS Payment Cancel] Payment cancelled successfully: ${paymentId}`);

    // Also update order payment status if exists
    try {
      const order = await prisma.order.findUnique({
        where: { orderNumber: payment.orderId },
      });

      if (order && order.paymentMethod === 'QRIS_CPM') {
        await prisma.order.update({
          where: { orderNumber: payment.orderId },
          data: {
            paymentStatus: 'FAILED',
            notes: `${order.notes ? order.notes + ' | ' : ''}Payment cancelled: ${reason}`,
          },
        });
        console.log(`[QRIS Payment Cancel] Order payment status updated: ${payment.orderId}`);
      }
    } catch (orderError) {
      console.error('[QRIS Payment Cancel] Failed to update order:', orderError);
      // Don't fail the cancel if order update fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Payment cancelled successfully',
      paymentId: cancelledPayment.paymentId,
      orderId: cancelledPayment.orderId,
      status: 'FAILED',
      cancelledAt: new Date(),
      reason: reason,
      gatewayCancelled: gatewayCancelled,
    });
  } catch (error) {
    console.error('[QRIS Payment Cancel] Error:', error);

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
