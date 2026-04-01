import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/categories/active - Get only active categories
export async function GET(request: NextRequest) {
  'use server'

  try {
    const searchParams = request.nextUrl.searchParams
    const includeProductCount = searchParams.get('includeProductCount') !== 'false'

    // Fetch only active categories
    const categories = await db.category.findMany({
      where: {
        isActive: true
      },
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
              isActive: true
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
    console.error('Error fetching active categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch active categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
