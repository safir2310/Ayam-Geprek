import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[QR API] Starting...')

    // Await params in Next.js 16
    const resolvedParams = await params
    console.log('[QR API] Resolved params:', resolvedParams)

    const memberId = resolvedParams.id

    // Validate memberId
    if (!memberId) {
      console.log('[QR API] Member ID is empty')
      return NextResponse.json(
        { success: false, error: 'Member ID tidak ditemukan' },
        { status: 400 }
      )
    }

    console.log('[QR API] Fetching QR for member:', memberId)

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
      console.log('[QR API] Member not found:', memberId)
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

    console.log('[QR API] QR generated successfully for:', member.name)

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
    console.error('Error generating member QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat QR code member' },
      { status: 500 }
    )
  }
}
