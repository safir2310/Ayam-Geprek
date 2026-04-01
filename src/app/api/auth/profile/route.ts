'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

// GET /api/auth/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // If user is a member, get member data too
    let memberData = null
    if (user.role === 'USER' && user.phone) {
      const member = await db.member.findUnique({
        where: { phone: user.phone },
        select: {
          points: true,
          pointHistory: true,
          address: true,
        },
      })

      if (member) {
        memberData = {
          points: member.points,
          pointHistory: member.pointHistory,
          address: member.address,
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        ...memberData,
      },
    })
  } catch (error) {
    console.error('Error getting profile:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/auth/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, phone, address } = body

    // Validate input
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    // Update user
    const user = await db.user.update({
      where: { id: decoded.userId },
      data: {
        name,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    // Update member address if user is a member
    if (user.role === 'USER' && phone) {
      const member = await db.member.findUnique({
        where: { phone },
      })

      if (member) {
        await db.member.update({
          where: { phone },
          data: {
            name,
            address: address || null,
          },
        })

        // Add address to user response
        ;(user as any).address = address
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
