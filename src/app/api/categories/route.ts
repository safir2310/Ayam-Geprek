import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/categories - Get all categories with product count
export async function GET(request: NextRequest) {
  'use server'

  try {
    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const includeProductCount = searchParams.get('includeProductCount') !== 'false'

    // Build where clause
    const where: any = {}

    // Filter by status
    if (!includeInactive) {
      where.isActive = true
    }

    // Fetch categories
    const categories = await db.category.findMany({
      where,
      orderBy: {
        order: 'asc'
      }
    })

    // Calculate product count for each category if requested
    let categoriesWithCount = categories
    if (includeProductCount) {
      categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const productCount = await db.product.count({
            where: {
              categoryId: category.id,
              ...(includeInactive ? {} : { isActive: true })
            }
          })
          return {
            ...category,
            productCount
          }
        })
      )
    }

    return NextResponse.json({
      success: true,
      data: categoriesWithCount,
      count: categoriesWithCount.length
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  'use server'

  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['name']
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

    // Validate name is not empty
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category name cannot be empty'
        },
        { status: 400 }
      )
    }

    // Check if category with same name already exists
    const existingCategory = await db.category.findFirst({
      where: {
        name: body.name
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category with this name already exists'
        },
        { status: 409 }
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

    // Get the highest current order if not provided
    let order = body.order !== undefined ? parseInt(body.order) : 0
    if (body.order === undefined) {
      const highestOrder = await db.category.findFirst({
        orderBy: {
          order: 'desc'
        },
        select: {
          order: true
        }
      })
      order = (highestOrder?.order ?? -1) + 1
    }

    // Create category
    const category = await db.category.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        icon: body.icon || null,
        color: body.color || null,
        order: order,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    })

    // Calculate initial product count
    const productCount = await db.product.count({
      where: {
        categoryId: category.id,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        productCount
      },
      message: 'Category created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
