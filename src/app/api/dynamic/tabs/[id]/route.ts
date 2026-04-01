import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch single tab by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tab = await db.dynamicTab.findUnique({
      where: { id: params.id },
      include: {
        pages: {
          orderBy: { order: 'asc' },
          include: {
            features: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
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

    return NextResponse.json({
      success: true,
      data: tab,
    })
  } catch (error) {
    console.error('Error fetching dynamic tab:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data tab',
      },
      { status: 500 }
    )
  }
}

// PUT - Update tab
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, label, icon, order, isActive } = body

    const updatedTab = await db.dynamicTab.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(label && { label: label.trim() }),
        ...(icon !== undefined && { icon: icon?.trim() || null }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedTab,
    })
  } catch (error) {
    console.error('Error updating dynamic tab:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate tab',
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete tab
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.dynamicTab.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Tab berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting dynamic tab:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus tab',
      },
      { status: 500 }
    )
  }
}
