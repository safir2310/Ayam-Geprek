'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { OrderStatus } from '@prisma/client'

/**
 * GET /api/orders/pending/count
 * Get count of pending orders
 */
export async function GET(request: NextRequest) {
  try {
    // Get count of pending orders
    const count = await db.order.count({
      where: {
        status: OrderStatus.PENDING
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        count,
        status: OrderStatus.PENDING
      }
    })
  } catch (error) {
    console.error('Error fetching pending orders count:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pending orders count'
    }, { status: 500 })
  }
}
