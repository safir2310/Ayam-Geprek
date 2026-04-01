import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings - Get public settings
export async function GET(request: NextRequest) {
  'use server'

  try {
    const searchParams = request.nextUrl.searchParams
    const keys = searchParams.get('keys')

    // If specific keys are requested
    if (keys) {
      const keyList = keys.split(',')
      const settings = await db.setting.findMany({
        where: {
          key: { in: keyList }
        }
      })

      const settingsMap: Record<string, string> = {}
      settings.forEach(setting => {
        settingsMap[setting.key] = setting.value
      })

      return NextResponse.json({
        success: true,
        data: settingsMap
      })
    }

    // Default public settings
    const defaultSettings = {
      restaurantName: 'AYAM GEPREK SAMBAL IJO',
      restaurantAddress: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151',
      restaurantPhone: '085260812758',
      restaurantEmail: '',
      currency: 'IDR',
      taxRate: '0',
      serviceCharge: '0',
      openingHours: '',
    }

    // Try to get settings from database
    const dbSettings = await db.setting.findMany({
      where: {
        key: { in: Object.keys(defaultSettings) }
      }
    })

    // Merge with default settings
    const settingsMap: Record<string, string> = { ...defaultSettings }
    dbSettings.forEach(setting => {
      settingsMap[setting.key] = setting.value
    })

    return NextResponse.json({
      success: true,
      data: settingsMap
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update settings (admin only)
export async function PUT(request: NextRequest) {
  'use server'

  try {
    const body = await request.json()

    if (!body.settings || typeof body.settings !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Settings object is required'
        },
        { status: 400 }
      )
    }

    // Upsert settings
    const updates = Object.entries(body.settings).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    )

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
