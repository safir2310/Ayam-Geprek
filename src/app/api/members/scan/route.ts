import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrData } = body

    if (!qrData) {
      return NextResponse.json(
        { success: false, error: 'QR code data diperlukan' },
        { status: 400 }
      )
    }

    // Decode QR data
    let decodedData
    try {
      decodedData = JSON.parse(Buffer.from(qrData, 'base64').toString())
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'QR code tidak valid' },
        { status: 400 }
      )
    }

    // Validate QR data format
    if (decodedData.type !== 'MEMBER' || !decodedData.id || !decodedData.phone) {
      return NextResponse.json(
        { success: false, error: 'QR code bukan QR code member yang valid' },
        { status: 400 }
      )
    }

    // Find member by ID and phone
    const member = await db.member.findUnique({
      where: {
        id: decodedData.id,
        phone: decodedData.phone,
        isActive: true
      },
      include: {
        pointHistory: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    })

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member tidak ditemukan atau tidak aktif' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        address: member.address,
        points: member.points,
        tier: member.tier || 'BRONZE',
        pointHistory: member.pointHistory || []
      }
    })
  } catch (error) {
    console.error('Error scanning member QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memindai QR code member' },
      { status: 500 }
    )
  }
}
