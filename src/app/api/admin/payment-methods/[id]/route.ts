import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/payment-methods/[id] - Get single payment method
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  'use server'

  try {
    const paymentMethod = await db.paymentMethodConfig.findUnique({
      where: { id: params.id }
    })

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment method not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: paymentMethod
    })
  } catch (error) {
    console.error('Error fetching payment method:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment method',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/admin/payment-methods/[id] - Update payment method
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  'use server'

  try {
    const body = await request.json()

    // Check if payment method exists
    const existing = await db.paymentMethodConfig.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment method not found'
        },
        { status: 404 }
      )
    }

    // Validate type if provided
    if (body.type) {
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
    }

    // Validate file size (max 5MB for Base64)
    const validateBase64Size = (base64?: string | null) => {
      if (!base64) return true
      const sizeInBytes = (base64.length * 3) / 4
      const maxSize = 5 * 1024 * 1024 // 5MB
      return sizeInBytes <= maxSize
    }

    if (body.qrCode && !validateBase64Size(body.qrCode)) {
      return NextResponse.json(
        {
          success: false,
          error: 'QR code image too large. Maximum size is 5MB'
        },
        { status: 400 }
      )
    }

    if (body.logo && !validateBase64Size(body.logo)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Logo image too large. Maximum size is 5MB'
        },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.qrCode !== undefined) updateData.qrCode = body.qrCode
    if (body.logo !== undefined) updateData.logo = body.logo
    if (body.provider !== undefined) updateData.provider = body.provider
    if (body.config !== undefined) updateData.config = body.config ? JSON.stringify(body.config) : null
    if (body.fee !== undefined) updateData.fee = parseFloat(body.fee)
    if (body.minAmount !== undefined) updateData.minAmount = parseFloat(body.minAmount)
    if (body.maxAmount !== undefined) updateData.maxAmount = body.maxAmount ? parseFloat(body.maxAmount) : null
    if (body.description !== undefined) updateData.description = body.description
    if (body.order !== undefined) updateData.order = parseInt(body.order)

    const paymentMethod = await db.paymentMethodConfig.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: paymentMethod,
      message: 'Payment method updated successfully'
    })
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update payment method',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/payment-methods/[id] - Delete payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  'use server'

  try {
    // Check if payment method exists
    const existing = await db.paymentMethodConfig.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment method not found'
        },
        { status: 404 }
      )
    }

    await db.paymentMethodConfig.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete payment method',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
