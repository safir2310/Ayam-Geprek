import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/categories/[id] - Get single category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  'use server'

  try {
    const { id } = await params

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
      }
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
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

    // Check if name is being updated and if it already exists
    if (body.name && body.name.trim() !== existingCategory.name) {
      const duplicateCategory = await db.category.findFirst({
        where: {
          name: body.name.trim(),
          id: {
            not: id
          }
        }
      })

      if (duplicateCategory) {
        return NextResponse.json(
          {
            success: false,
            error: 'Category with this name already exists'
          },
          { status: 409 }
        )
      }
    }

    // Validate name is not empty if provided
    if (body.name !== undefined && body.name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category name cannot be empty'
        },
        { status: 400 }
      )
    }

    // Validate order if provided
    if (body.order !== undefined && (isNaN(body.order) || body.order < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order must be a valid number greater than or equal to 0'
        },
        { status: 400 }
      )
    }

    // Update category
    const category = await db.category.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.icon !== undefined && { icon: body.icon || null }),
        ...(body.color !== undefined && { color: body.color || null }),
        ...(body.order !== undefined && { order: parseInt(body.order) }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
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
      message: 'Category updated successfully'
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  'use server'

  try {
    const { id } = await params

    // Check if category exists
    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
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

    // Prevent deletion if category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete category that contains products',
          productCount: category._count.products,
          suggestion: 'Consider deactivating the category instead'
        },
        { status: 409 }
      )
    }

    // Delete category
    await db.category.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
