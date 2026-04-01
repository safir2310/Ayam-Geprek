'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ShiftStatus } from '@prisma/client'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

/**
 * GET /api/shifts/current
 * Get current open shift for the authenticated cashier
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request)

    if (authResult.error) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: authResult.status })
    }

    const user = authResult.user!

    // Only cashiers can have current shifts
    if (user.role !== 'CASHIER' && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({
        success: false,
        error: 'Only cashiers can access current shift'
      }, { status: 403 })
    }

    // Find the most recent open shift for this cashier
    const currentShift = await db.cashierShift.findFirst({
      where: {
        cashierId: user.id,
        status: ShiftStatus.OPEN
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        openedAt: 'desc'
      }
    })

    if (!currentShift) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No open shift found'
      })
    }

    return NextResponse.json({
      success: true,
      data: currentShift
    })
  } catch (error) {
    console.error('Error fetching current shift:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch current shift'
    }, { status: 500 })
  }
}
