import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to determine member tier based on points
function getMemberTier(points: number): string {
  if (points >= 1000) return 'PLATINUM'
  if (points >= 500) return 'GOLD'
  if (points >= 100) return 'SILVER'
  return 'BRONZE'
}

// GET /api/members/[id] - Get single member by ID
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

    // Fetch member with related data
    const member = await db.member.findUnique({
      where: { id },
      include: {
        orders: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        },
        transactions: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            transactionNo: true,
            finalAmount: true,
            createdAt: true
          }
        }
      }
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

    // Add computed tier and statistics
    const memberWithTier = {
      ...member,
      tier: getMemberTier(member.points),
      stats: {
        totalOrders: member.orders.length,
        totalTransactions: member.transactions.length,
        totalSpent: member.transactions.reduce((sum, t) => sum + t.finalAmount, 0)
      }
    }

    return NextResponse.json({
      success: true,
      data: memberWithTier
    })
  } catch (error) {
    console.error('Error fetching member:', error)
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

// PUT /api/members/[id] - Update member
export async function PUT(
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

    // Check if member exists
    const existingMember = await db.member.findUnique({
      where: { id }
    })

    if (!existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member not found'
        },
        { status: 404 }
      )
    }

    // Validate phone number format (if being updated)
    if (body.phone && body.phone !== existingMember.phone) {
      const phoneRegex = /^[\d\s\-+()]+$/
      if (!phoneRegex.test(body.phone)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid phone number format'
          },
          { status: 400 }
        )
      }

      // Check if new phone number already exists
      const phoneExists = await db.member.findUnique({
        where: { phone: body.phone }
      })

      if (phoneExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Member with this phone number already exists'
          },
          { status: 409 }
        )
      }
    }

    // Validate email format (if being updated)
    if (body.email && body.email !== existingMember.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid email format'
          },
          { status: 400 }
        )
      }
    }

    // Validate points (if being updated manually)
    if (body.points !== undefined) {
      if (isNaN(body.points) || body.points < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Points must be a valid number greater than or equal to 0'
          },
          { status: 400 }
        )
      }
    }

    // Build update data object
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email || null
    if (body.address !== undefined) updateData.address = body.address || null
    if (body.points !== undefined) updateData.points = parseInt(body.points)
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    // Update member
    const updatedMember = await db.member.update({
      where: { id },
      data: updateData
    })

    // Add computed tier
    const memberWithTier = {
      ...updatedMember,
      tier: getMemberTier(updatedMember.points)
    }

    return NextResponse.json({
      success: true,
      data: memberWithTier,
      message: 'Member updated successfully'
    })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update member',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/members/[id] - Delete member
export async function DELETE(
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
      where: { id },
      include: {
        orders: true,
        transactions: true
      }
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

    // Check if member has orders or transactions
    if (member.orders.length > 0 || member.transactions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete member with existing orders or transactions',
          message: 'Consider deactivating the member instead of deleting',
          data: {
            orderCount: member.orders.length,
            transactionCount: member.transactions.length
          }
        },
        { status: 409 }
      )
    }

    // Delete member (cascade will delete point history)
    await db.member.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete member',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
