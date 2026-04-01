import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/payment-methods - Get all payment methods
export async function GET(request: NextRequest) {
  'use server'

  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    const where: any = {}

    if (type) {
      where.type = type
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const paymentMethods = await db.paymentMethodConfig.findMany({
      where,
      orderBy: {
        order: 'asc'
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

// POST /api/admin/payment-methods - Create new payment method
export async function POST(request: NextRequest) {
  'use server'

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and type are required'
        },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['CASH', 'QRIS', 'TRANSFER', 'E_WALLET', 'CARD', 'BANK_TRANSFER']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment method type',
          validTypes
        },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB for Base64)
    const validateBase64Size = (base64?: string | null) => {
      if (!base64) return true
      // Base64 string is approximately 33% larger than original
      const sizeInBytes = (base64.length * 3) / 4
      const maxSize = 5 * 1024 * 1024 // 5MB
      return sizeInBytes <= maxSize
    }

    if (!validateBase64Size(body.qrCode)) {
      return NextResponse.json(
        {
          success: false,
          error: 'QR code image too large. Maximum size is 5MB'
        },
        { status: 400 }
      )
    }

    if (!validateBase64Size(body.logo)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Logo image too large. Maximum size is 5MB'
        },
        { status: 400 }
      )
    }

    const paymentMethod = await db.paymentMethodConfig.create({
      data: {
        name: body.name,
        type: body.type,
        isActive: body.isActive !== undefined ? body.isActive : true,
        qrCode: body.qrCode || null,
        logo: body.logo || null,
        provider: body.provider || null,
        config: body.config ? JSON.stringify(body.config) : null,
        fee: body.fee !== undefined ? parseFloat(body.fee) : 0,
        minAmount: body.minAmount !== undefined ? parseFloat(body.minAmount) : 0,
        maxAmount: body.maxAmount !== undefined ? parseFloat(body.maxAmount) : null,
        description: body.description || null,
        order: body.order !== undefined ? parseInt(body.order) : 0
      }
    })

    return NextResponse.json({
      success: true,
      data: paymentMethod,
      message: 'Payment method created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment method:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create payment method',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
