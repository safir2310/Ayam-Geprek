import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products/low-stock - Get products with low stock
export async function GET(request: NextRequest) {
  'use server'
  
  try {
    const searchParams = request.nextUrl.searchParams
    const threshold = searchParams.get('threshold')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Build where clause - products where stock is less than or equal to minStock
    const where: any = {
      stock: {
        lte: db.product.fields.minStock
      }
    }

    // Optionally override with custom threshold
    if (threshold && !isNaN(parseInt(threshold))) {
      where.stock = {
        lte: parseInt(threshold)
      }
    }

    // Filter by active status unless explicitly requested
    if (!includeInactive) {
      where.isActive = true
    }

    // Fetch products with category relation
    const products = await db.product.findMany({
      where,
      include: {
        category: true
      },
      orderBy: [
        {
          stock: 'asc' // Lowest stock first
        },
        {
          name: 'asc'
        }
      ]
    })

    // Calculate stock status for each product
    const productsWithStatus = products.map(product => {
      const stockDifference = product.stock - product.minStock
      let stockStatus: 'out-of-stock' | 'low-stock' | 'near-low-stock'
      
      if (product.stock === 0) {
        stockStatus = 'out-of-stock'
      } else if (stockDifference < 0) {
        stockStatus = 'low-stock'
      } else {
        stockStatus = 'near-low-stock'
      }

      return {
        ...product,
        stockStatus,
        stockDifference
      }
    })

    return NextResponse.json({
      success: true,
      data: productsWithStatus,
      count: productsWithStatus.length,
      summary: {
        outOfStock: productsWithStatus.filter(p => p.stockStatus === 'out-of-stock').length,
        lowStock: productsWithStatus.filter(p => p.stockStatus === 'low-stock').length,
        nearLowStock: productsWithStatus.filter(p => p.stockStatus === 'near-low-stock').length
      }
    })
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    return NextResponse.json(
      {
        success: false,
      error: 'Failed to fetch low stock products',
      message: error instanceof Error ? error.message : 'Unknown error'
    },
    { status: 500 }
    )
  }
}
