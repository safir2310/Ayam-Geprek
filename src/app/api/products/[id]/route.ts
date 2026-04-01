import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products/[id] - Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  'use server'
  
  try {
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockLogs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
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

    // Check if barcode is being updated and if it's already taken
    if (body.barcode && body.barcode !== existingProduct.barcode) {
      const existingBarcode = await db.product.findUnique({
        where: { barcode: body.barcode }
      })

      if (existingBarcode) {
        return NextResponse.json(
          {
            success: false,
            error: 'Product with this barcode already exists'
          },
          { status: 409 }
        )
      }
    }

    // Check if SKU is being updated and if it's already taken
    if (body.sku && body.sku !== existingProduct.sku) {
      const existingSku = await db.product.findUnique({
        where: { sku: body.sku }
      })

      if (existingSku) {
        return NextResponse.json(
          {
            success: false,
            error: 'Product with this SKU already exists'
          },
          { status: 409 }
        )
      }
    }

    // Validate category exists if being updated
    if (body.categoryId && body.categoryId !== existingProduct.categoryId) {
      const category = await db.category.findUnique({
        where: { id: body.categoryId }
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
    }

    // Validate price if being updated
    if (body.price !== undefined && (isNaN(body.price) || body.price < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Price must be a valid number greater than or equal to 0'
        },
        { status: 400 }
      )
    }

    // Validate stock if being updated
    if (body.stock !== undefined && (isNaN(body.stock) || body.stock < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stock must be a valid number greater than or equal to 0'
        },
        { status: 400 }
      )
    }

    // Validate minStock if being updated
    if (body.minStock !== undefined && (isNaN(body.minStock) || body.minStock < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Minimum stock must be a valid number greater than or equal to 0'
        },
        { status: 400 }
      )
    }

    // Track stock change for logging
    let stockChange = 0
    if (body.stock !== undefined && existingProduct.stock !== undefined) {
      stockChange = parseInt(body.stock) - existingProduct.stock
    }

    // Update product
    const product = await db.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.barcode !== undefined && { barcode: body.barcode || null }),
        ...(body.sku !== undefined && { sku: body.sku || null }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.image !== undefined && { image: body.image || null }),
        ...(body.stock !== undefined && { stock: parseInt(body.stock) }),
        ...(body.minStock !== undefined && { minStock: parseInt(body.minStock) }),
        ...(body.cost !== undefined && { cost: body.cost !== null ? parseFloat(body.cost) : null }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      },
      include: {
        category: true
      }
    })

    // Create stock log if stock changed
    if (stockChange !== 0) {
      await db.stockLog.create({
        data: {
          productId: product.id,
          quantity: Math.abs(stockChange),
          type: stockChange > 0 ? 'IN' : 'OUT',
          reason: 'Stock adjustment from product update'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  'use server'
  
  try {
    const { id } = await params

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
            transactionItems: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      )
    }

    // Check if product has been used in orders or transactions
    const hasOrders = product._count.orderItems > 0
    const hasTransactions = product._count.transactionItems > 0

    if (hasOrders || hasTransactions) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete product that has been used in orders or transactions',
          suggestion: 'Consider deactivating the product instead'
        },
        { status: 409 }
      )
    }

    // Delete product
    await db.product.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
