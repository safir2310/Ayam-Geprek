'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications/queue-service';

/**
 * POST /api/notifications/whatsapp/send
 * Send a WhatsApp message using the notification queue
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { recipient, type, templateData, customMessage, gateway } = body;

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number is required' },
        { status: 400 }
      );
    }

    if (!type && !customMessage) {
      return NextResponse.json(
        { success: false, error: 'Either notification type or custom message is required' },
        { status: 400 }
      );
    }

    // Validate notification type if provided
    const validTypes = [
      'ORDER_NEW',
      'ORDER_CONFIRMED',
      'ORDER_COMPLETED',
      'PAYMENT_RECEIVED',
      'STOCK_LOW',
      'STOCK_EMPTY',
    ];

    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate gateway if provided
    if (gateway) {
      const validGateways = ['fonnte', 'wablas', 'twilio'];
      if (!validGateways.includes(gateway)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid gateway. Must be one of: ${validGateways.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Create notification in queue
    const result = await createNotification({
      type: type || 'ORDER_NEW',
      recipient,
      templateData,
      customMessage,
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
      message: 'Notification queued successfully',
      notification: result.notification,
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/whatsapp/send:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
