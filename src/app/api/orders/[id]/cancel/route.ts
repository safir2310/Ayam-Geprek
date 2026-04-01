'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { broadcastOrderUpdated } from '@/lib/websocket/client'
import { OrderStatus, PaymentStatus } from '@/lib/enums'

// Schema for canceling an order
const cancelOrderSchema = z.object({
  reason: z.string().optional()
})

/**
 * PATCH /api/orders/[id]/cancel
 * Cancel an order
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = cancelOrderSchema.parse(body)

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    })

    if (!existingOrder) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 })
    }

    // Check if order can be cancelled
    if (existingOrder.status === OrderStatus.CANCELLED) {
      return NextResponse.json({
        success: false,
        error: 'Order is already cancelled'
      }, { status: 400 })
    }

    if (existingOrder.status === OrderStatus.COMPLETED || existingOrder.status === OrderStatus.DELIVERED) {
      return NextResponse.json({
        success: false,
        error: 'Cannot cancel completed or delivered orders'
      }, { status: 400 })
    }

    // Check if order is already paid
    if (existingOrder.paymentStatus === PaymentStatus.PAID) {
      return NextResponse.json({
        success: false,
        error: 'Cannot cancel paid orders. Please process a refund first.'
      }, { status: 400 })
    }

    // Cancel order and restore stock in a transaction
    const cancelledOrder = await db.$transaction(async (tx) => {
      // Update order status
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
          notes: validatedData.reason
            ? `CANCELLED: ${validatedData.reason}`
            : 'Order cancelled',
          updatedAt: new Date()
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              points: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        }
      })

      // Restore points if they were used
      if (order.pointsUsed > 0 && order.memberId) {
        await tx.member.update({
          where: { id: order.memberId },
          data: {
            points: {
              increment: order.pointsUsed
            }
          }
        })

        // Log point restoration
        await tx.pointHistory.create({
          data: {
            memberId: order.memberId,
            points: order.pointsUsed,
            type: 'ADJUSTMENT',
            reference: order.orderNumber,
            notes: 'Points restored after order cancellation'
          }
        })
      }

      // Deduct points that were earned (if order was not completed)
      if (order.pointsEarned > 0 && order.memberId) {
        await tx.member.update({
          where: { id: order.memberId },
          data: {
            points: {
              decrement: order.pointsEarned
            }
          }
        })

        // Log point deduction
        await tx.pointHistory.create({
          data: {
            memberId: order.memberId,
            points: -order.pointsEarned,
            type: 'ADJUSTMENT',
            reference: order.orderNumber,
            notes: 'Points deducted after order cancellation'
          }
        })
      }

      // Restore stock for each item
      for (const item of existingOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })

        // Create stock log
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: 'IN',
            reference: order.orderNumber,
            reason: `Order #${order.orderNumber} cancelled - stock restored`
          }
        })
      }

      return order
    })

    // Broadcast order cancellation via WebSocket
    broadcastOrderUpdated({
      orderId: cancelledOrder.id,
      orderNumber: cancelledOrder.orderNumber,
      previousStatus: existingOrder.status,
      newStatus: OrderStatus.CANCELLED,
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      data: cancelledOrder
    })
  } catch (error) {
    console.error('Error cancelling order:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid cancellation data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to cancel order'
    }, { status: 500 })
  }
}
