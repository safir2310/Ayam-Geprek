import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings/qris - Get QRIS image URL
export async function GET(request: NextRequest) {
  try {
    const setting = await db.setting.findUnique({
      where: { key: 'qris_qr_code' }
    })

    return NextResponse.json({
      success: true,
      data: setting?.value || null
    })
  } catch (error) {
    console.error('Error fetching QRIS settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch QRIS settings'
      },
      { status: 500 }
    )
  }
}

// POST /api/settings/qris - Update QRIS image URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCodeUrl } = body

    if (!qrCodeUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'QR code URL is required'
        },
        { status: 400 }
      )
    }

    // Upsert the QRIS setting
    const setting = await db.setting.upsert({
      where: { key: 'qris_qr_code' },
      update: { value: qrCodeUrl },
      create: {
        key: 'qris_qr_code',
        value: qrCodeUrl,
        category: 'payment'
      }
    })

    return NextResponse.json({
      success: true,
      data: setting
    })
  } catch (error) {
    console.error('Error updating QRIS settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update QRIS settings'
      },
      { status: 500 }
    )
  }
}
