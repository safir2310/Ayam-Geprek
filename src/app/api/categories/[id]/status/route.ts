import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/categories/[id]/status - Toggle category active/inactive status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  'use server'

  try {
    const { id } = await params
    const body = await request.json()

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found'
        },
        { status: 404 }
      )
    }

    // Determine new status - either use provided value or toggle
    const newStatus = body.isActive !== undefined
      ? body.isActive
      : !existingCategory.isActive

    // Update category status
    const category = await db.category.update({
      where: { id },
      data: {
        isActive: newStatus
      }
    })

    // Calculate product count
    const productCount = await db.product.count({
      where: {
        categoryId: category.id
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        productCount
      },
      message: `Category ${newStatus ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('Error updating category status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
