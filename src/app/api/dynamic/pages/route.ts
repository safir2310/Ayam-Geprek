import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all dynamic pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tabId = searchParams.get('tabId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (tabId) {
      where.tabId = tabId
    }
    if (!includeInactive) {
      where.isActive = true
    }

    const pages = await db.dynamicPage.findMany({
      where,
      include: {
        tab: {
          select: {
            id: true,
            name: true,
            label: true,
            icon: true,
          },
        },
        features: {
          where: includeInactive ? {} : { isVisible: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
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
        error: 'Gagal mengambil data pages',
      },
      { status: 500 }
    )
  }
}

// POST - Create new dynamic page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tabId, name, title, description, order, layout = 'grid', isActive = true } = body

    // Validation
    if (!tabId || !name || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tab ID, nama, dan judul wajib diisi',
        },
        { status: 400 }
      )
    }

    // Check if tab exists
    const tab = await db.dynamicTab.findUnique({
      where: { id: tabId },
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

    // Create page
    const newPage = await db.dynamicPage.create({
      data: {
        tabId,
        name: name.trim(),
        title: title.trim(),
        description: description?.trim() || null,
        order: order || 0,
        layout: layout || 'grid',
        isActive,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: newPage,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating dynamic page:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal membuat page baru',
      },
      { status: 500 }
    )
  }
}
