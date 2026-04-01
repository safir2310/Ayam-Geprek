'use server';

import { NextRequest, NextResponse } from 'next/server';
import {
  processPendingNotifications,
  retryFailedNotifications,
  getNotificationStats,
} from '@/lib/notifications/queue-service';

/**
 * POST /api/notifications/queue/process
 * Process pending notifications (send them via WhatsApp)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'process', limit = 50, retryFailed = false } = body;

    // Validate action
    const validActions = ['process', 'retry', 'all'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
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

    let result;

    if (action === 'retry' || retryFailed) {
      // Retry failed notifications
      result = await retryFailedNotifications(limit);
    } else if (action === 'all') {
      // Process both pending and failed notifications
      const pendingResult = await processPendingNotifications(limit);
      const failedResult = await retryFailedNotifications(Math.ceil(limit / 2));

      result = {
        processed: pendingResult.processed + failedResult.processed,
        succeeded: pendingResult.succeeded + failedResult.succeeded,
        failed: pendingResult.failed + failedResult.failed,
        errors: [...pendingResult.errors, ...failedResult.errors],
      };
    } else {
      // Process pending notifications only
      result = await processPendingNotifications(limit);
    }

    // Get statistics
    const statsResult = await getNotificationStats();

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} notifications`,
      result,
      stats: statsResult.success ? statsResult.stats : undefined,
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/queue/process:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
