'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ShiftStatus, PaymentMethod, UserRole } from '@/lib/enums'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { broadcastShiftUpdated } from '@/lib/websocket/client'

// Schema for closing a shift
const closeShiftSchema = z.object({
  physicalBalance: z.number().min(0, 'Physical balance must be non-negative'),
  notes: z.string().optional()
})

/**
 * POST /api/shifts/[id]/close
 * Close a shift and calculate reconciliation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shiftId } = await params
    const body = await request.json()

    // Validate ID format
    if (!shiftId || shiftId.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Invalid shift ID'
      }, { status: 400 })
    }

    // Validate request body
    const validatedData = closeShiftSchema.parse(body)

    // Get authenticated user
    const authResult = await getAuthenticatedUser(request)

    if (authResult.error) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: authResult.status })
    }

    const user = authResult.user!

    // Get the shift
    const shift = await db.cashierShift.findUnique({
      where: { id: shiftId },
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

    if (!shift) {
      return NextResponse.json({
        success: false,
        error: 'Shift not found'
      }, { status: 404 })
    }

    // Check if shift is already closed
    if (shift.status === ShiftStatus.CLOSED) {
      return NextResponse.json({
        success: false,
        error: 'Shift is already closed'
      }, { status: 400 })
    }

    // Check permissions: only the shift owner, admins, or managers can close
    if (
      shift.cashierId !== user.id &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.MANAGER
    ) {
      return NextResponse.json({
        success: false,
        error: 'You do not have permission to close this shift'
      }, { status: 403 })
    }

    // Get all transactions for this shift
    const transactions = await db.transaction.findMany({
      where: { shiftId },
      include: {
        payments: true
      }
    })

    // Calculate totals
    let totalSales = 0
    let cashSales = 0
    let nonCashSales = 0

    transactions.forEach(transaction => {
      totalSales += transaction.finalAmount

      // Calculate cash vs non-cash sales
      if (transaction.paymentMethod === PaymentMethod.CASH) {
        cashSales += transaction.finalAmount
      } else {
        nonCashSales += transaction.finalAmount
      }
    })

    // Calculate system balance (opening balance + cash sales)
    const systemBalance = shift.openingBalance + cashSales

    // Calculate difference (physical balance - system balance)
    const difference = validatedData.physicalBalance - systemBalance

    // Update and close the shift
    const closedShift = await db.cashierShift.update({
      where: { id: shiftId },
      data: {
        closingBalance: validatedData.physicalBalance,
        totalSales,
        cashSales,
        nonCashSales,
        systemBalance,
        physicalBalance: validatedData.physicalBalance,
        difference,
        status: ShiftStatus.CLOSED,
        closedAt: new Date()
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
      }
    })

    // Broadcast shift closed event
    broadcastShiftUpdated({
      shiftId: closedShift.id,
      action: 'closed',
      userId: user.id,
      userName: user.name,
      timestamp: closedShift.closedAt!
    })

    return NextResponse.json({
      success: true,
      data: closedShift,
      message: 'Shift closed successfully',
      reconciliation: {
        openingBalance: shift.openingBalance,
        cashSales,
        nonCashSales,
        systemBalance,
        physicalBalance: validatedData.physicalBalance,
        difference,
        isBalanced: difference === 0,
        transactionCount: transactions.length
      }
    })
  } catch (error) {
    console.error('Error closing shift:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid closing data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to close shift'
    }, { status: 500 })
  }
}
