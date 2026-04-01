import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/categories/[id]/reorder - Reorder category to new position
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  'use server'

  try {
    const { id } = await params
    const body = await request.json()

    // Validate new order position
    if (body.order === undefined || isNaN(body.order) || body.order < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid order position. Must be a number >= 0'
        },
        { status: 400 }
      )
    }

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

    const newOrder = parseInt(body.order)
    const oldOrder = existingCategory.order

    // If order is the same, no changes needed
    if (newOrder === oldOrder) {
      return NextResponse.json({
        success: true,
        data: existingCategory,
        message: 'Category order unchanged'
      })
    }

    // Start a transaction to handle reordering
    await db.$transaction(async (tx) => {
      if (newOrder < oldOrder) {
        // Moving category to a lower position (higher priority)
        // Increment orders of categories between newOrder and oldOrder
        await tx.category.updateMany({
          where: {
            order: {
              gte: newOrder,
              lt: oldOrder
            },
            id: {
              not: id
            }
          },
          data: {
            order: {
              increment: 1
            }
          }
        })
      } else {
        // Moving category to a higher position (lower priority)
        // Decrement orders of categories between oldOrder and newOrder
        await tx.category.updateMany({
          where: {
            order: {
              gt: oldOrder,
              lte: newOrder
            },
            id: {
              not: id
            }
          },
          data: {
            order: {
              decrement: 1
            }
          }
        })
      }

      // Update the category's order
      await tx.category.update({
        where: { id },
        data: {
          order: newOrder
        }
      })
    })

    // Fetch the updated category
    const category = await db.category.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found'
        },
        { status: 404 }
      )
    }

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
      message: `Category reordered to position ${newOrder}`
    })
  } catch (error) {
    console.error('Error reordering category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reorder category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
