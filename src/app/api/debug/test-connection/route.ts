import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    const result = await db.$queryRaw`SELECT NOW() as now`

    // Test categories
    const categoriesCount = await db.category.count()

    // Test products
    const productsCount = await db.product.count()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        currentTime: result[0]?.now,
        categories: categoriesCount,
        products: productsCount
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      code: error.code,
      meta: error.meta
    }, { status: 500 })
  }
}
