'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { paymentGatewayService } from '@/lib/payment-gateway';
import { PaymentStatusResponse, PaymentStatus } from '@/types/payment';

/**
 * GET /api/payments/[id]/status
 * Check payment status by payment ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment ID is required',
        },
        { status: 400 }
      );
    }

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

    // Convert gateway to lowercase for service
    const gatewayLower = payment.gateway.toLowerCase() as any;

    // If payment is still pending, check status with gateway
    if (payment.status === 'PENDING') {
      try {
        if (payment.transactionId) {
          const gatewayStatus = await paymentGatewayService.getPaymentStatus(
            gatewayLower,
            payment.transactionId
          );

          // Update payment if gateway has new status
          if (gatewayStatus.status !== 'PENDING') {
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

            // Update payment in database
            const updatedPayment = await prisma.qRISPayment.update({
              where: { paymentId },
              data: updateData,
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
                    paymentStatus: gatewayStatus.status as any,
                  },
                });
              }
            } catch (orderError) {
              console.error('[Payment Status] Failed to update order:', orderError);
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
              metadata: updatedPayment.metadata ? JSON.parse(updatedPayment.metadata) : undefined,
            });
          }
        }
      } catch (gatewayError) {
        console.error('[Payment Status] Gateway check failed:', gatewayError);
        // Continue with database status if gateway check fails
      }

      // Check if payment has expired
      if (payment.expiryTime < new Date()) {
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
          }
        } catch (orderError) {
          console.error('[Payment Status] Failed to update order:', orderError);
        }

        return NextResponse.json<PaymentStatusResponse>({
          success: true,
          paymentId: expiredPayment.paymentId,
          orderId: expiredPayment.orderId,
          status: 'EXPIRED',
          amount: expiredPayment.amount,
          expiryTime: expiredPayment.expiryTime,
          gateway: gatewayLower,
          metadata: expiredPayment.metadata ? JSON.parse(expiredPayment.metadata) : undefined,
        });
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
      metadata: payment.metadata ? JSON.parse(payment.metadata) : undefined,
    });
  } catch (error) {
    console.error('[Payment Status] Error:', error);

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
