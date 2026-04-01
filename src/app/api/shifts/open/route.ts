'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ShiftStatus, UserRole } from '@/lib/enums'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { broadcastShiftUpdated } from '@/lib/websocket/client'

// Schema for opening a new shift
const openShiftSchema = z.object({
  openingBalance: z.number().min(0, 'Opening balance must be non-negative'),
  notes: z.string().optional()
})

/**
 * POST /api/shifts/open
 * Open a new shift for the authenticated cashier
 */
export async function POST(request: NextRequest) {
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

    // Only cashiers, admins, and managers can open shifts
    if (user.role !== UserRole.CASHIER && user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
      return NextResponse.json({
        success: false,
        error: 'Only cashiers, admins, and managers can open shifts'
      }, { status: 403 })
    }

    const body = await request.json()

    // Validate request body
    const validatedData = openShiftSchema.parse(body)

    // Check if there's already an open shift for this cashier
    const existingOpenShift = await db.cashierShift.findFirst({
      where: {
        cashierId: user.id,
        status: ShiftStatus.OPEN
      }
    })

    if (existingOpenShift) {
      return NextResponse.json({
        success: false,
        error: 'You already have an open shift. Please close it before opening a new one.',
        currentShiftId: existingOpenShift.id
      }, { status: 400 })
    }

    // Create new shift
    const shift = await db.cashierShift.create({
      data: {
        cashierId: user.id,
        cashierName: user.name,
        openingBalance: validatedData.openingBalance,
        totalSales: 0,
        cashSales: 0,
        nonCashSales: 0,
        systemBalance: validatedData.openingBalance,
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
        }
      }
    })

    // Broadcast shift opened event
    broadcastShiftUpdated({
      shiftId: shift.id,
      action: 'opened',
      userId: user.id,
      userName: user.name,
      timestamp: shift.createdAt
    })

    return NextResponse.json({
      success: true,
      data: shift,
      message: 'Shift opened successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error opening shift:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid shift data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to open shift'
    }, { status: 500 })
  }
}
