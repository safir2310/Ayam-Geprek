import { db } from '@/lib/db';
import { sendWhatsAppMessage, getDefaultGateway, getGatewayConfig } from './gateways';
import { getTemplate, MessageTemplateData } from './templates';

/**
 * Notification Queue Service
 * Manages notification queue, sending, and retry logic
 */

export type NotificationType =
  | 'ORDER_NEW'
  | 'ORDER_CONFIRMED'
  | 'ORDER_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'STOCK_LOW'
  | 'STOCK_EMPTY';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface CreateNotificationOptions {
  type: NotificationType;
  recipient: string;
  templateData?: MessageTemplateData;
  customMessage?: string;
  gateway?: 'fonnte' | 'wablas' | 'twilio';
}

export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// Maximum retry attempts
const MAX_RETRY_ATTEMPTS = 3;

// Create notification in queue
export async function createNotification(options: CreateNotificationOptions) {
  try {
    // Generate message from template
    let message: string;

    if (options.customMessage) {
      message = options.customMessage;
    } else if (options.templateData) {
      message = getTemplate(options.type, options.templateData);
    } else {
      message = `Notification: ${options.type}`;
    }

    // Store in database
    const notification = await db.notification.create({
      data: {
        type: options.type as any,
        recipient: options.recipient,
        message,
        status: 'PENDING',
        attempts: 0,
      },
    });

    return {
      success: true,
      notification,
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get pending notifications from queue
export async function getPendingNotifications(limit: number = 50) {
  try {
    const notifications = await db.notification.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });

    return {
      success: true,
      notifications,
      count: notifications.length,
    };
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      notifications: [],
      count: 0,
    };
  }
}

// Get all notifications with optional filters
export async function getNotifications(filters: {
  status?: NotificationStatus;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}) {
  try {
    const { status, type, limit = 50, offset = 0 } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where }),
    ]);

    return {
      success: true,
      notifications,
      count: notifications.length,
      total,
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      notifications: [],
      count: 0,
      total: 0,
    };
  }
}

// Get failed notifications (for retry)
export async function getFailedNotifications(limit: number = 20) {
  try {
    const notifications = await db.notification.findMany({
      where: {
        status: 'FAILED',
        attempts: {
          lt: MAX_RETRY_ATTEMPTS,
        },
      },
      orderBy: {
        updatedAt: 'asc',
      },
      take: limit,
    });

    return {
      success: true,
      notifications,
      count: notifications.length,
    };
  } catch (error) {
    console.error('Error getting failed notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      notifications: [],
      count: 0,
    };
  }
}

// Send single notification
export async function sendNotification(notificationId: string) {
  try {
    // Get notification
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return {
        success: false,
        error: 'Notification not found',
      };
    }

    if (notification.status === 'SENT') {
      return {
        success: true,
        notification,
        alreadySent: true,
      };
    }

    // Get gateway
    const gatewayType = getDefaultGateway();
    const gatewayConfig = getGatewayConfig(gatewayType);

    // Send message
    const result = await sendWhatsAppMessage(
      gatewayType,
      notification.recipient,
      notification.message,
      gatewayConfig
    );

    // Update notification status
    if (result.success) {
      const updated = await db.notification.update({
        where: { id: notificationId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      return {
        success: true,
        notification: updated,
      };
    } else {
      // Check if should be marked as permanently failed
      const newAttempts = notification.attempts + 1;
      const isPermanentlyFailed = newAttempts >= MAX_RETRY_ATTEMPTS;

      const updated = await db.notification.update({
        where: { id: notificationId },
        data: {
          status: isPermanentlyFailed ? 'FAILED' : 'PENDING',
          attempts: { increment: 1 },
        },
      });

      return {
        success: false,
        notification: updated,
        error: result.error,
        isPermanentlyFailed,
      };
    }
  } catch (error) {
    console.error('Error sending notification:', error);

    // Mark as failed
    try {
      await db.notification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          attempts: { increment: 1 },
        },
      });
    } catch (updateError) {
      console.error('Error updating notification status:', updateError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Process pending notifications
export async function processPendingNotifications(limit: number = 50): Promise<ProcessResult> {
  const result: ProcessResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get pending notifications
    const { notifications } = await getPendingNotifications(limit);

    if (!notifications || notifications.length === 0) {
      return result;
    }

    result.processed = notifications.length;

    // Process each notification
    for (const notification of notifications) {
      const sendResult = await sendNotification(notification.id);

      if (sendResult.success) {
        result.succeeded++;
      } else {
        result.failed++;
        if (sendResult.error) {
          result.errors.push({
            id: notification.id,
            error: sendResult.error,
          });
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error processing notifications:', error);
    result.errors.push({
      id: 'system',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return result;
  }
}

// Retry failed notifications
export async function retryFailedNotifications(limit: number = 20): Promise<ProcessResult> {
  const result: ProcessResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get failed notifications
    const { notifications } = await getFailedNotifications(limit);

    if (!notifications || notifications.length === 0) {
      return result;
    }

    result.processed = notifications.length;

    // Process each notification
    for (const notification of notifications) {
      // Reset status to PENDING
      await db.notification.update({
        where: { id: notification.id },
        data: { status: 'PENDING' },
      });

      const sendResult = await sendNotification(notification.id);

      if (sendResult.success) {
        result.succeeded++;
      } else {
        result.failed++;
        if (sendResult.error) {
          result.errors.push({
            id: notification.id,
            error: sendResult.error,
          });
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error retrying notifications:', error);
    result.errors.push({
      id: 'system',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return result;
  }
}

// Get notification statistics
export async function getNotificationStats() {
  try {
    const [pending, sent, failed, total] = await Promise.all([
      db.notification.count({ where: { status: 'PENDING' } }),
      db.notification.count({ where: { status: 'SENT' } }),
      db.notification.count({ where: { status: 'FAILED' } }),
      db.notification.count(),
    ]);

    return {
      success: true,
      stats: {
        pending,
        sent,
        failed,
        total,
      },
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        pending: 0,
        sent: 0,
        failed: 0,
        total: 0,
      },
    };
  }
}

// Delete old notifications (cleanup)
export async function deleteOldNotifications(daysOld: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: 'SENT',
      },
    });

    return {
      success: true,
      deleted: result.count,
    };
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      deleted: 0,
    };
  }
}
