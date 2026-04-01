import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all features for a page
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const features = await db.dynamicFeature.findMany({
      where: {
        pageId: params.id,
        isVisible: true,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: features,
    })
  } catch (error) {
    console.error('Error fetching dynamic features:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data fitur',
      },
      { status: 500 }
    )
  }
}

// POST - Create new feature in a page
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, title, type, content, order } = body

    // Validation
    if (!name || !title || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nama, judul, dan tipe wajib diisi',
        },
        { status: 400 }
      )
    }

    // Verify page exists
    const page = await db.dynamicPage.findUnique({
      where: { id: params.id },
    })

    if (!page) {
      return NextResponse.json(
        {
          success: false,
          error: 'Halaman tidak ditemukan',
        },
        { status: 404 }
      )
    }

    // Get max order if not provided
    let featureOrder = order
    if (featureOrder === undefined) {
      const maxFeature = await db.dynamicFeature.findFirst({
        where: { pageId: params.id },
        orderBy: { order: 'desc' },
      })
      featureOrder = (maxFeature?.order || 0) + 1
    }

    const feature = await db.dynamicFeature.create({
      data: {
        pageId: params.id,
        name: name.trim(),
        title: title.trim(),
        type: type.toUpperCase(),
        content: content ? JSON.stringify(content) : '{}',
        order: featureOrder,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: feature,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating dynamic feature:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal membuat fitur baru',
      },
      { status: 500 }
    )
  }
}
