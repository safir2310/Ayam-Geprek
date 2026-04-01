'use server';

import { NextRequest, NextResponse } from 'next/server';
import { paymentGatewayService } from '@/lib/payment-gateway';
import { db as prisma } from '@/lib/db';

/**
 * GET /api/payments
 * Get payment gateway status and information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Get enabled gateways
    if (action === 'gateways') {
      const enabledGateways = paymentGatewayService.getEnabledGateways();

      return NextResponse.json({
        success: true,
        data: {
          gateways: enabledGateways,
          count: enabledGateways.length,
        },
      });
    }

    // Get payment statistics
    if (action === 'stats') {
      const [total, pending, paid, expired, failed] = await Promise.all([
        prisma.qRISPayment.count(),
        prisma.qRISPayment.count({ where: { status: 'PENDING' } }),
        prisma.qRISPayment.count({ where: { status: 'PAID' } }),
        prisma.qRISPayment.count({ where: { status: 'EXPIRED' } }),
        prisma.qRISPayment.count({ where: { status: 'FAILED' } }),
      ]);

      const totalAmount = await prisma.qRISPayment.aggregate({
        _sum: { amount: true, paidAmount: true },
        where: { status: 'PAID' },
      });

      return NextResponse.json({
        success: true,
        data: {
          total,
          pending,
          paid,
          expired,
          failed,
          totalPaidAmount: totalAmount._sum.paidAmount || 0,
          totalAmount: totalAmount._sum.amount || 0,
        },
      });
    }

    // Default response - API information
    return NextResponse.json({
      success: true,
      message: 'QRIS CPM Payment API',
      version: '1.0.0',
      endpoints: {
        create: {
          method: 'POST',
          path: '/api/payments/qris/create',
          description: 'Create a new QRIS payment (Customer Present Mode)',
        },
        callback: {
          method: 'POST',
          path: '/api/payments/qris/callback',
          description: 'Handle payment gateway callback',
        },
        status: {
          method: 'GET',
          path: '/api/payments/[id]/status',
          description: 'Check payment status by payment ID',
        },
        expire: {
          method: 'POST',
          path: '/api/payments/qris/expire',
          description: 'Expire a pending QRIS payment',
        },
        info: {
          method: 'GET',
          path: '/api/payments?action=gateways',
          description: 'Get enabled payment gateways',
        },
        stats: {
          method: 'GET',
          path: '/api/payments?action=stats',
          description: 'Get payment statistics',
        },
      },
      supportedGateways: paymentGatewayService.getEnabledGateways(),
    });
  } catch (error) {
    console.error('[Payments API] Error:', error);

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
