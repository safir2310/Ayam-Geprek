import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products/barcode/[barcode] - Get product by barcode
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  'use server'
  
  try {
    const { barcode } = await params

    const product = await db.product.findUnique({
      where: { barcode },
      include: {
        category: true
      }
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found with this barcode'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error fetching product by barcode:', error)
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
