import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products - Get all products with optional filters
export async function GET(request: NextRequest) {
  'use server'
  
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Build where clause
    const where: any = {}

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Filter by status
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    } else if (!includeInactive) {
      // By default, only show active products unless explicitly requested
      where.isActive = true
    }

    // Search in name, description, barcode, or sku
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
        { sku: { contains: search } }
      ]
    }

    // Fetch products with category relation
    const products = await db.product.findMany({
      where,
      include: {
        category: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  'use server'
  
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'price', 'categoryId']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          fields: missingFields
        },
        { status: 400 }
      )
    }

    // Validate price
    if (isNaN(body.price) || body.price < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Price must be a valid number greater than or equal to 0'
        },
        { status: 400 }
      )
    }

    // Validate stock
    if (body.stock !== undefined && (isNaN(body.stock) || body.stock < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stock must be a valid number greater than or equal to 0'
        },
        { status: 400 }
      )
    }

    // Validate minStock
    if (body.minStock !== undefined && (isNaN(body.minStock) || body.minStock < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Minimum stock must be a valid number greater than or equal to 0'
        },
        { status: 400 }
      )
    }

    // Check if category exists
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

    // Check if barcode already exists (if provided)
    if (body.barcode) {
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

    // Check if SKU already exists (if provided)
    if (body.sku) {
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

    // Create product
    const product = await db.product.create({
      data: {
        name: body.name,
        description: body.description || null,
        price: parseFloat(body.price),
        barcode: body.barcode || null,
        sku: body.sku || null,
        categoryId: body.categoryId,
        image: body.image || null,
        stock: body.stock !== undefined ? parseInt(body.stock) : 0,
        minStock: body.minStock !== undefined ? parseInt(body.minStock) : 5,
        cost: body.cost !== undefined ? parseFloat(body.cost) : null,
        isActive: body.isActive !== undefined ? body.isActive : true
      },
      include: {
        category: true
      }
    })

    // Create initial stock log if stock is provided
    if (body.stock && body.stock > 0) {
      await db.stockLog.create({
        data: {
          productId: product.id,
          quantity: parseInt(body.stock),
          type: 'INITIAL',
          reason: 'Initial stock on product creation'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
