import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/products/[id]/status - Toggle product active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  'use server'
  
  try {
    const { id } = await params
    const body = await request.json()

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      )
    }

    // Determine new status - either use provided value or toggle
    const newStatus = body.isActive !== undefined 
      ? body.isActive 
      : !existingProduct.isActive

    // Update product status
    const product = await db.product.update({
      where: { id },
      data: {
        isActive: newStatus
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({
      success: true,
      data: product,
      message: `Product ${newStatus ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('Error updating product status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update product status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
