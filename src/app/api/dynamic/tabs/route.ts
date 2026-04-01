import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all dynamic tabs
export async function GET(request: NextRequest) {
  try {
    const tabs = await db.dynamicTab.findMany({
      where: {
        isActive: true,
      },
      include: {
        pages: {
          where: {
            isActive: true,
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
      data: tabs,
    })
  } catch (error) {
    console.error('Error fetching dynamic tabs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data tab',
      },
      { status: 500 }
    )
  }
}

// POST - Create new dynamic tab
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, label, icon, order } = body

    // Validation
    if (!name || !label) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nama dan label wajib diisi',
        },
        { status: 400 }
      )
    }

    // Get max order if not provided
    let tabOrder = order
    if (tabOrder === undefined) {
      const maxTab = await db.dynamicTab.findFirst({
        orderBy: { order: 'desc' },
      })
      tabOrder = (maxTab?.order || 0) + 1
    }

    const tab = await db.dynamicTab.create({
      data: {
        name: name.trim(),
        label: label.trim(),
        icon: icon?.trim() || null,
        order: tabOrder,
      },
      include: {
        pages: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: tab,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating dynamic tab:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal membuat tab baru',
      },
      { status: 500 }
    )
  }
}
