'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { paymentGatewayService } from '@/lib/payment-gateway';
import { PaymentStatusResponse, PaymentStatus } from '@/types/payment';

/**
 * GET /api/payments/qris/status/[paymentId]
 * Check QRIS payment status by payment ID
 *
 * This endpoint:
 * 1. Retrieves payment from database
 * 2. If payment is PENDING, checks status with gateway
 * 3. Updates payment status if gateway returns new status
 * 4. Checks if payment has expired based on expiryTime
 * 5. Returns current payment status
 *
 * @param paymentId - The payment ID to check
 * @returns Payment status with all relevant details
 */
export async function GET(
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

    console.log(`[QRIS Payment Status] Checking status for payment: ${paymentId}`);

    // Find payment in database
    const payment = await prisma.qRISPayment.findUnique({
      where: { paymentId },
    });

    if (!payment) {
      console.error(`[QRIS Payment Status] Payment not found: ${paymentId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment not found',
        },
        { status: 404 }
      );
    }

    // Convert gateway to lowercase for service
    const gatewayLower = payment.gateway.toLowerCase() as 'midtrans' | 'xendit' | 'tripay';

    // If payment is still pending, check status with gateway
    if (payment.status === 'PENDING') {
      try {
        if (payment.transactionId) {
          console.log(`[QRIS Payment Status] Checking gateway status for transaction: ${payment.transactionId}`);

          const gatewayStatus = await paymentGatewayService.getPaymentStatus(
            gatewayLower,
            payment.transactionId
          );

          // Update payment if gateway has new status
          if (gatewayStatus.status !== 'PENDING') {
            console.log(`[QRIS Payment Status] Gateway returned new status: ${gatewayStatus.status}`);

            const updateData: any = {
              status: gatewayStatus.status as PaymentStatus,
              updatedAt: new Date(),
            };

            if (gatewayStatus.paidAmount !== undefined) {
              updateData.paidAmount = gatewayStatus.paidAmount;
            }

            if (gatewayStatus.paymentMethod) {
              updateData.paymentMethod = gatewayStatus.paymentMethod;
            }

            if (gatewayStatus.paidAt) {
              updateData.paidAt = gatewayStatus.paidAt;
            }

            // If payment is paid, set paidAt if not provided by gateway
            if (gatewayStatus.status === 'PAID' && !gatewayStatus.paidAt) {
              updateData.paidAt = new Date();
            }

            // Update payment in database
            const updatedPayment = await prisma.qRISPayment.update({
              where: { paymentId },
              data: updateData,
            });

            console.log(`[QRIS Payment Status] Payment updated in database: ${paymentId} -> ${gatewayStatus.status}`);

            // Also update order payment status if exists
            try {
              const order = await prisma.order.findUnique({
                where: { orderNumber: payment.orderId },
              });

              if (order && order.paymentMethod === 'QRIS_CPM') {
                await prisma.order.update({
                  where: { orderNumber: payment.orderId },
                  data: {
                    paymentStatus: gatewayStatus.status as any,
                  },
                });
                console.log(`[QRIS Payment Status] Order payment status updated: ${payment.orderId} -> ${gatewayStatus.status}`);
              }
            } catch (orderError) {
              console.error('[QRIS Payment Status] Failed to update order:', orderError);
              // Don't fail the status check if order update fails
            }

            // Parse metadata if exists
            let parsedMetadata = undefined;
            if (updatedPayment.metadata) {
              try {
                parsedMetadata = JSON.parse(updatedPayment.metadata);
              } catch (parseError) {
                console.error('[QRIS Payment Status] Failed to parse metadata:', parseError);
              }
            }

            // Return updated payment
            return NextResponse.json<PaymentStatusResponse>({
              success: true,
              paymentId: updatedPayment.paymentId,
              orderId: updatedPayment.orderId,
              status: updatedPayment.status as PaymentStatus,
              amount: updatedPayment.amount,
              paidAmount: updatedPayment.paidAmount || undefined,
              paymentMethod: updatedPayment.paymentMethod || undefined,
              transactionId: updatedPayment.transactionId || undefined,
              paidAt: updatedPayment.paidAt || undefined,
              expiryTime: updatedPayment.expiryTime,
              gateway: gatewayLower,
              metadata: parsedMetadata,
            });
          }
        }
      } catch (gatewayError) {
        console.error('[QRIS Payment Status] Gateway check failed:', gatewayError);
        // Continue with database status if gateway check fails
      }

      // Check if payment has expired
      const now = new Date();
      if (payment.expiryTime < now) {
        console.log(`[QRIS Payment Status] Payment has expired: ${paymentId}`);

        // Update to expired status
        const expiredPayment = await prisma.qRISPayment.update({
          where: { paymentId },
          data: {
            status: 'EXPIRED' as PaymentStatus,
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
                paymentStatus: 'EXPIRED' as any,
              },
            });
            console.log(`[QRIS Payment Status] Order payment status updated to EXPIRED: ${payment.orderId}`);
          }
        } catch (orderError) {
          console.error('[QRIS Payment Status] Failed to update order:', orderError);
        }

        // Parse metadata if exists
        let parsedMetadata = undefined;
        if (expiredPayment.metadata) {
          try {
            parsedMetadata = JSON.parse(expiredPayment.metadata);
          } catch (parseError) {
            console.error('[QRIS Payment Status] Failed to parse metadata:', parseError);
          }
        }

        return NextResponse.json<PaymentStatusResponse>({
          success: true,
          paymentId: expiredPayment.paymentId,
          orderId: expiredPayment.orderId,
          status: 'EXPIRED',
          amount: expiredPayment.amount,
          expiryTime: expiredPayment.expiryTime,
          gateway: gatewayLower,
          metadata: parsedMetadata,
        });
      }
    }

    // Parse metadata if exists
    let parsedMetadata = undefined;
    if (payment.metadata) {
      try {
        parsedMetadata = JSON.parse(payment.metadata);
      } catch (parseError) {
        console.error('[QRIS Payment Status] Failed to parse metadata:', parseError);
      }
    }

    // Return payment status from database
    return NextResponse.json<PaymentStatusResponse>({
      success: true,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      status: payment.status as PaymentStatus,
      amount: payment.amount,
      paidAmount: payment.paidAmount || undefined,
      paymentMethod: payment.paymentMethod || undefined,
      transactionId: payment.transactionId || undefined,
      paidAt: payment.paidAt || undefined,
      expiryTime: payment.expiryTime,
      gateway: gatewayLower,
      metadata: parsedMetadata,
    });
  } catch (error) {
    console.error('[QRIS Payment Status] Error:', error);

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
