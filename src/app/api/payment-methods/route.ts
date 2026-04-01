import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/payment-methods - Get active payment methods for public use (User dashboard, POS)
export async function GET(request: NextRequest) {
  'use server'

  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    const where: any = {
      isActive: true
    }

    // Filter by type if specified
    if (type) {
      where.type = type
    }

    const paymentMethods = await db.paymentMethodConfig.findMany({
      where,
      orderBy: {
        order: 'asc'
      },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        qrCode: true,
        logo: true,
        fee: true,
        minAmount: true,
        maxAmount: true,
        description: true,
        order: true
      }
    })

    return NextResponse.json({
      success: true,
      data: paymentMethods,
      count: paymentMethods.length
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment methods',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
