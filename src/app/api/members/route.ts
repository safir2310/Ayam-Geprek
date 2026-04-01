import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to determine member tier based on points
function getMemberTier(points: number): string {
  if (points >= 1000) return 'PLATINUM'
  if (points >= 500) return 'GOLD'
  if (points >= 100) return 'SILVER'
  return 'BRONZE'
}

// GET /api/members - Get all members with filters
export async function GET(request: NextRequest) {
  'use server'

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const tier = searchParams.get('tier')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}

    // Search in name, phone, or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filter by status
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Fetch members
    let members = await db.member.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add computed tier to each member
    members = members.map(member => ({
      ...member,
      tier: getMemberTier(member.points)
    })) as Array<typeof members[0] & { tier: string }>

    // Filter by tier (computed field, so we do it in memory)
    if (tier) {
      const upperTier = tier.toUpperCase()
      members = members.filter((member: any) => member.tier === upperTier)
    }

    // Calculate tier statistics
    const tierCounts = members.reduce((acc: Record<string, number>, member: any) => {
      const tier = member.tier
      acc[tier] = (acc[tier] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate total points across all members
    const totalPoints = members.reduce((sum, member) => sum + member.points, 0)

    return NextResponse.json({
      success: true,
      data: members,
      count: members.length,
      stats: {
        tierCounts,
        totalPoints
      }
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch members',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/members - Create new member
export async function POST(request: NextRequest) {
  'use server'

  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'phone']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          fields: missingFields
        },
        { status: 400 }
      )
    }

    // Validate phone number format (basic validation)
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

    // Validate email format (if provided)
    if (body.email) {
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

    // Check if phone number already exists
    const existingMember = await db.member.findUnique({
      where: { phone: body.phone }
    })

    if (existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member with this phone number already exists'
        },
        { status: 409 }
      )
    }

    // Create member
    const member = await db.member.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        points: 0,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    })

    // Add computed tier
    const memberWithTier = {
      ...member,
      tier: getMemberTier(member.points)
    }

    return NextResponse.json({
      success: true,
      data: memberWithTier,
      message: 'Member created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create member',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
