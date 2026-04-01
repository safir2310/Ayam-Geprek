import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders/customer/[phone] - Get orders by customer phone number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params

    console.log('[Orders API] Fetching orders for phone:', phone)

    // Validate phone number
    if (!phone || phone.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone number is required'
        },
        { status: 400 }
      )
    }

    // Fetch orders by customer phone
    const orders = await db.order.findMany({
      where: {
        customerPhone: phone
      },
      include: {
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
        },
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            points: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('[Orders API] Found', orders.length, 'orders for phone:', phone)

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length
    })
  } catch (error) {
    console.error('[Orders API] Error fetching orders by phone:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
