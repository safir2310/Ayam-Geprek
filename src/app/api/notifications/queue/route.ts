'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, getNotificationStats } from '@/lib/notifications/queue-service';

/**
 * GET /api/notifications/queue
 * Get notification queue with optional filters
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const type = searchParams.get('type') as any;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate status
    const validStatuses = ['PENDING', 'SENT', 'FAILED', undefined];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.filter(Boolean).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = [
      'ORDER_NEW',
      'ORDER_CONFIRMED',
      'ORDER_COMPLETED',
      'PAYMENT_RECEIVED',
      'STOCK_LOW',
      'STOCK_EMPTY',
      undefined,
    ];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.filter(Boolean).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Validate offset
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { success: false, error: 'Offset must be a non-negative number' },
        { status: 400 }
      );
    }

    // Get notifications
    const result = await getNotifications({
      status,
      type,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Get statistics
    const statsResult = await getNotificationStats();

    return NextResponse.json({
      success: true,
      data: result.notifications,
      pagination: {
        limit,
        offset,
        total: result.total,
        count: result.count,
        hasMore: offset + result.count < result.total,
      },
      stats: statsResult.success ? statsResult.stats : undefined,
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/queue:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
