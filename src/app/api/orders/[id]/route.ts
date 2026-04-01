'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/orders/[id]
 * Get a single order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Validate ID format (basic check)
    if (!orderId || orderId.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order ID'
      }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            points: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                price: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        transaction: {
          select: {
            id: true,
            transactionNo: true,
            totalAmount: true,
            paymentMethod: true,
            createdAt: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Error fetching order:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch order'
    }, { status: 500 })
  }
}
