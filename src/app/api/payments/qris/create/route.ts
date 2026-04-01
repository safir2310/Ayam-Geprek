'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { paymentGatewayService } from '@/lib/payment-gateway';
import {
  CreateQRISPaymentRequest,
  CreateQRISPaymentResponse,
  PaymentGateway,
  PaymentStatus,
} from '@/types/payment';
import { z } from 'zod';

/**
 * Validation schema for QRIS payment creation
 */
const createQRISPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be positive'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  gateway: z.enum(['midtrans', 'xendit', 'tripay'], {
    message: 'Invalid gateway. Must be midtrans, xendit, or tripay',
  }),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
  })).optional(),
  expiryMinutes: z.number().int().positive().optional().default(30),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/payments/qris/create
 * Create a new QRIS payment (Customer Present Mode)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createQRISPaymentSchema.parse(body);

    const {
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      gateway,
      items,
      expiryMinutes,
      metadata,
    } = validatedData;

    // Convert gateway to uppercase for Prisma enum
    const gatewayUpper = gateway.toUpperCase() as any;

    // Check if order already has a QRIS payment
    const existingPayment = await prisma.qRISPayment.findUnique({
      where: { orderId },
    });

    if (existingPayment) {
      // If payment exists and is not expired/failed, return it
      if (existingPayment.status === 'PENDING' && existingPayment.expiryTime > new Date()) {
        return NextResponse.json<CreateQRISPaymentResponse>({
          success: true,
          paymentId: existingPayment.paymentId,
          orderId: existingPayment.orderId,
          amount: existingPayment.amount,
          gateway: gateway,
          qrCode: existingPayment.qrCode,
          qrString: existingPayment.qrString,
          expiryTime: existingPayment.expiryTime,
          paymentUrl: existingPayment.paymentUrl || undefined,
          createdAt: existingPayment.createdAt,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Order already has a payment. Please use a new order ID or check the existing payment status.',
          },
          { status: 409 }
        );
      }
    }

    // Verify gateway is enabled
    if (!paymentGatewayService.isGatewayEnabled(gateway)) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment gateway ${gateway} is not enabled`,
        },
        { status: 400 }
      );
    }

    // Create payment with gateway
    const gatewayResponse = await paymentGatewayService.createQRISPayment(gateway, {
      orderId,
      amount,
      customerName,
      customerEmail: customerEmail || undefined,
      customerPhone,
      items,
      expiryMinutes,
    });

    if (!gatewayResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create payment with gateway',
        },
        { status: 500 }
      );
    }

    // Generate unique payment ID
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Save payment to database
    const qrisPayment = await prisma.qRISPayment.create({
      data: {
        paymentId,
        orderId,
        gateway: gatewayUpper,
        amount,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        status: 'PENDING',
        transactionId: gatewayResponse.transactionId,
        qrCode: gatewayResponse.qrCode,
        qrString: gatewayResponse.qrString,
        paymentUrl: gatewayResponse.paymentUrl || null,
        expiryTime: gatewayResponse.expiryTime,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Return success response
    return NextResponse.json<CreateQRISPaymentResponse>({
      success: true,
      paymentId: qrisPayment.paymentId,
      orderId: qrisPayment.orderId,
      amount: qrisPayment.amount,
      gateway: gateway,
      qrCode: qrisPayment.qrCode,
      qrString: qrisPayment.qrString,
      expiryTime: qrisPayment.expiryTime,
      paymentUrl: qrisPayment.paymentUrl || undefined,
      createdAt: qrisPayment.createdAt,
    });
  } catch (error) {
    console.error('[QRIS Payment Create] Error:', error);

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
