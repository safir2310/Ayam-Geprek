import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to determine member tier based on points
function getMemberTier(points: number): string {
  if (points >= 1000) return 'PLATINUM'
  if (points >= 500) return 'GOLD'
  if (points >= 100) return 'SILVER'
  return 'BRONZE'
}

// GET /api/members/phone/[phone] - Get member by phone number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  'use server'

  try {
    const { phone } = await params

    // Validate phone number
    if (!phone || phone.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone number is required'
        },
        { status: 400 }
      )
    }

    // Fetch member by phone
    const member = await db.member.findUnique({
      where: { phone },
      include: {
        pointHistory: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member not found with this phone number'
        },
        { status: 404 }
      )
    }

    // Add computed tier
    const memberWithTier = {
      ...member,
      tier: getMemberTier(member.points)
    }

    return NextResponse.json({
      success: true,
      data: memberWithTier
    })
  } catch (error) {
    console.error('Error fetching member by phone:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch member',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
