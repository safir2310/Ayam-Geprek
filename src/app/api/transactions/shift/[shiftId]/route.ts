'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

/**
 * GET /api/transactions/shift/[shiftId]
 * Get transactions by shift ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  try {
    // Await params to get actual values
    const { shiftId } = await params

    // Verify shift exists
    const shift = await db.cashierShift.findUnique({
      where: { id: shiftId }
    })

    if (!shift) {
      return NextResponse.json({
        success: false,
        error: 'Shift not found'
      }, { status: 404 })
    }

    // Get transactions for the shift
    const transactions = await db.transaction.findMany({
      where: {
        shiftId: shiftId
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
                image: true
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
    const summary = {
      totalTransactions: transactions.length,
      totalSales: 0,
      cashSales: 0,
      nonCashSales: 0,
      totalDiscount: 0,
      totalTax: 0,
      avgTransactionAmount: 0,
      paymentMethods: {} as Record<string, number>
    }

    transactions.forEach(tx => {
      if (tx.paymentStatus === 'REFUNDED') {
        return // Skip voided transactions from summary
      }

      summary.totalSales += tx.finalAmount
      summary.totalDiscount += tx.discountAmount
      summary.totalTax += tx.taxAmount

      if (tx.paymentMethod === 'CASH') {
        summary.cashSales += tx.finalAmount
      } else {
        summary.nonCashSales += tx.finalAmount
      }

      // Track payment methods
      const method = tx.paymentMethod
      summary.paymentMethods[method] = (summary.paymentMethods[method] || 0) + 1
    })

    // Calculate average
    const validTransactions = transactions.filter(
      tx => tx.paymentStatus !== 'REFUNDED'
    )
    if (validTransactions.length > 0) {
      summary.avgTransactionAmount = summary.totalSales / validTransactions.length
    }

    return NextResponse.json({
      success: true,
      data: {
        shift: {
          id: shift.id,
          cashierName: shift.cashierName,
          status: shift.status,
          openedAt: shift.openedAt,
          closedAt: shift.closedAt,
          openingBalance: shift.openingBalance,
          closingBalance: shift.closingBalance,
          totalSales: shift.totalSales
        },
        transactions,
        summary
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
