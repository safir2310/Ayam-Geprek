'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { OrderStatus } from '@prisma/client'
import { z } from 'zod'
import { broadcastOrderUpdated } from '@/lib/websocket/client'

// Schema for updating order status
const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus)
})

/**
 * PUT /api/orders/[id]/status
 * Update order status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = updateStatusSchema.parse(body)

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 })
    }

    // Store previous status for WebSocket broadcast
    const previousStatus = existingOrder.status

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [OrderStatus.DELIVERED],
      [OrderStatus.CANCELLED]: [], // No transitions allowed from cancelled
      [OrderStatus.DELIVERED]: [] // No transitions allowed from delivered
    }

    const allowedTransitions = validTransitions[previousStatus] || []

    if (!allowedTransitions.includes(validatedData.status)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status transition from ${previousStatus} to ${validatedData.status}`,
        allowedTransitions
      }, { status: 400 })
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: validatedData.status,
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

    // Broadcast order update via WebSocket
    broadcastOrderUpdated({
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      previousStatus,
      newStatus: validatedData.status,
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      data: updatedOrder
    })
  } catch (error) {
    console.error('Error updating order status:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update order status'
    }, { status: 500 })
  }
}
