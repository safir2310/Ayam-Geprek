import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to determine member tier based on points
function getMemberTier(points: number): string {
  if (points >= 1000) return 'PLATINUM'
  if (points >= 500) return 'GOLD'
  if (points >= 100) return 'SILVER'
  return 'BRONZE'
}

// POST /api/members/[id]/points/redeem - Redeem points
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  'use server'

  try {
    const { id } = await params
    const body = await request.json()

    // Validate ID format
    if (!id || id.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid member ID'
        },
        { status: 400 }
      )
    }

    // Validate required fields
    if (body.points === undefined || body.points === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Points value is required'
        },
        { status: 400 }
      )
    }

    // Validate points value
    const pointsToRedeem = parseInt(body.points)
    if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Points must be a positive number'
        },
        { status: 400 }
      )
    }

    // Validate points value is not too large
    if (pointsToRedeem > 100000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Points value too large (maximum 100,000)'
        },
        { status: 400 }
      )
    }

    // Check if member exists
    const member = await db.member.findUnique({
      where: { id }
    })

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member not found'
        },
        { status: 404 }
      )
    }

    // Check if member is active
    if (!member.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot redeem points from inactive member'
        },
        { status: 400 }
      )
    }

    // Check if member has enough points
    if (member.points < pointsToRedeem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient points balance',
          message: `Member has ${member.points} points, but trying to redeem ${pointsToRedeem} points`,
          data: {
            currentPoints: member.points,
            requestedPoints: pointsToRedeem,
            shortfall: pointsToRedeem - member.points
          }
        },
        { status: 400 }
      )
    }

    // Use transaction to ensure data consistency
    const updatedMember = await db.$transaction(async (tx) => {
      // Deduct points from member
      const updated = await tx.member.update({
        where: { id },
        data: {
          points: member.points - pointsToRedeem
        }
      })

      // Create point history record
      await tx.pointHistory.create({
        data: {
          memberId: id,
          points: pointsToRedeem,
          type: 'REDEEMED',
          reference: body.reference || null,
          notes: body.notes || `Points redeemed: ${pointsToRedeem}`
        }
      })

      return updated
    })

    // Add computed tier
    const memberWithTier = {
      ...updatedMember,
      tier: getMemberTier(updatedMember.points)
    }

    // Calculate monetary value (1 point = Rp10,000)
    const monetaryValue = pointsToRedeem * 10000

    return NextResponse.json({
      success: true,
      data: memberWithTier,
      message: `Successfully redeemed ${pointsToRedeem} points (Rp${monetaryValue.toLocaleString('id-ID')})`,
      pointsRedeemed: pointsToRedeem,
      monetaryValue
    })
  } catch (error) {
    console.error('Error redeeming points:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to redeem points',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
