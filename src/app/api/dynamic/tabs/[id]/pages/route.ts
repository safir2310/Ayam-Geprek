import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all pages for a tab
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pages = await db.dynamicPage.findMany({
      where: {
        tabId: params.id,
        isActive: true,
      },
      include: {
        features: {
          where: {
            isVisible: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: pages,
    })
  } catch (error) {
    console.error('Error fetching dynamic pages:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data halaman',
      },
      { status: 500 }
    )
  }
}

// POST - Create new page in a tab
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, title, description, layout, order } = body

    // Validation
    if (!name || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nama dan judul wajib diisi',
        },
        { status: 400 }
      )
    }

    // Verify tab exists
    const tab = await db.dynamicTab.findUnique({
      where: { id: params.id },
    })

    if (!tab) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tab tidak ditemukan',
        },
        { status: 404 }
      )
    }

    // Get max order if not provided
    let pageOrder = order
    if (pageOrder === undefined) {
      const maxPage = await db.dynamicPage.findFirst({
        where: { tabId: params.id },
        orderBy: { order: 'desc' },
      })
      pageOrder = (maxPage?.order || 0) + 1
    }

    const page = await db.dynamicPage.create({
      data: {
        tabId: params.id,
        name: name.trim(),
        title: title.trim(),
        description: description?.trim() || null,
        layout: layout || 'grid',
        order: pageOrder,
      },
      include: {
        features: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: page,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating dynamic page:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal membuat halaman baru',
      },
      { status: 500 }
    )
  }
}
