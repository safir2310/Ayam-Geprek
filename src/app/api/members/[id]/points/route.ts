import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/members/[id]/points - Get member point history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  'use server'

  try {
    const { id } = await params

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // EARNED, REDEEMED, ADJUSTMENT
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for point history
    const where: any = { memberId: id }
    if (type && ['EARNED', 'REDEEMED', 'ADJUSTMENT'].includes(type.toUpperCase())) {
      where.type = type.toUpperCase()
    }

    // Fetch point history
    const pointHistory = await db.pointHistory.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.min(limit, 100), // Max 100 records
      skip: offset
    })

    // Calculate statistics
    const totalEarned = await db.pointHistory.aggregate({
      where: { memberId: id, type: 'EARNED' },
      _sum: { points: true }
    })

    const totalRedeemed = await db.pointHistory.aggregate({
      where: { memberId: id, type: 'REDEEMED' },
      _sum: { points: true }
    })

    const totalAdjustments = await db.pointHistory.aggregate({
      where: { memberId: id, type: 'ADJUSTMENT' },
      _sum: { points: true }
    })

    // Count total records for pagination
    const totalCount = await db.pointHistory.count({ where })

    // Calculate adjusted points (positive for earned, negative for redeemed, can be positive or negative for adjustments)
    const adjustmentPoints = totalAdjustments._sum.points || 0
    const calculatedBalance = (totalEarned._sum.points || 0) - (totalRedeemed._sum.points || 0) + adjustmentPoints

    return NextResponse.json({
      success: true,
      data: pointHistory,
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        currentPoints: member.points,
        calculatedBalance
      },
      stats: {
        totalEarned: totalEarned._sum.points || 0,
        totalRedeemed: totalRedeemed._sum.points || 0,
        totalAdjustments: adjustmentPoints,
        currentBalance: member.points
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + pointHistory.length < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching point history:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch point history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
