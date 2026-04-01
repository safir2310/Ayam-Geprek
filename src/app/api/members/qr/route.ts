import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/members/qr?memberId=xxx - Get member QR code
export async function GET(request: NextRequest) {
  try {
    console.log('[QR API Query] Starting...')

    // Get memberId from query params
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get('memberId')

    console.log('[QR API Query] Member ID from query:', memberId)

    // Validate memberId
    if (!memberId) {
      console.log('[QR API Query] Member ID is empty')
      return NextResponse.json(
        { success: false, error: 'Member ID tidak ditemukan di query parameter' },
        { status: 400 }
      )
    }

    console.log('[QR API Query] Fetching QR for member:', memberId)

    // Get member data
    const member = await db.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        phone: true,
        points: true,
      }
    })

    if (!member) {
      console.log('[QR API Query] Member not found:', memberId)
      return NextResponse.json(
        { success: false, error: 'Member tidak ditemukan' },
        { status: 404 }
      )
    }

    // Generate QR code data (member ID encoded as base64 for QR)
    const qrData = Buffer.from(JSON.stringify({
      type: 'MEMBER',
      id: member.id,
      phone: member.phone,
      name: member.name
    })).toString('base64')

    console.log('[QR API Query] QR generated successfully for:', member.name)

    return NextResponse.json({
      success: true,
      data: {
        qrData,
        member: {
          id: member.id,
          name: member.name,
          phone: member.phone,
          points: member.points,
        }
      }
    })
  } catch (error) {
    console.error('Error generating member QR code (query):', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat QR code member' },
      { status: 500 }
    )
  }
}
