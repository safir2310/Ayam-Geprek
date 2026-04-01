'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/shifts/[id]/transactions
 * Get all transactions for a specific shift
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shiftId } = await params

    // Validate ID format
    if (!shiftId || shiftId.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Invalid shift ID'
      }, { status: 400 })
    }

    // Check if shift exists
    const shift = await db.cashierShift.findUnique({
      where: { id: shiftId }
    })

    if (!shift) {
      return NextResponse.json({
        success: false,
        error: 'Shift not found'
      }, { status: 404 })
    }

    // Get transactions for this shift
    const transactions = await db.transaction.findMany({
      where: { shiftId },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            points: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true
              }
            }
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calculate summary statistics
    const totalAmount = transactions.reduce((sum, t) => sum + t.finalAmount, 0)
    const cashSales = transactions
      .filter(t => t.paymentMethod === 'CASH')
      .reduce((sum, t) => sum + t.finalAmount, 0)
    const nonCashSales = transactions
      .filter(t => t.paymentMethod !== 'CASH')
      .reduce((sum, t) => sum + t.finalAmount, 0)

    return NextResponse.json({
      success: true,
      data: transactions,
      summary: {
        totalTransactions: transactions.length,
        totalAmount,
        cashSales,
        nonCashSales
      }
    })
  } catch (error) {
    console.error('Error fetching shift transactions:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch shift transactions'
    }, { status: 500 })
  }
}
