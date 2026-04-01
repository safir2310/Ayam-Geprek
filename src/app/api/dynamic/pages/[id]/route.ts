import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch single page by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const page = await db.dynamicPage.findUnique({
      where: { id: params.id },
      include: {
        tab: true,
        features: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!page) {
      return NextResponse.json(
        {
          success: false,
          error: 'Page tidak ditemukan',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: page,
    })
  } catch (error) {
    console.error('Error fetching dynamic page:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data page',
      },
      { status: 500 }
    )
  }
}

// PUT - Update page
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, title, description, order, layout, isActive } = body

    const updatedPage = await db.dynamicPage.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(order !== undefined && { order }),
        ...(layout && { layout }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedPage,
    })
  } catch (error) {
    console.error('Error updating dynamic page:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate page',
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.dynamicPage.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Page berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting dynamic page:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus page',
      },
      { status: 500 }
    )
  }
}
