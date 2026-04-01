'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

/**
 * GET /api/transactions/daily/[date]
 * Get daily transactions by date (format: YYYY-MM-DD)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    // Await params to get actual values
    const { date: dateStr } = await params

    // Validate date format
    const date = new Date(dateStr)

    if (isNaN(date.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      }, { status: 400 })
    }

    // Get query parameters for optional filtering
    const searchParams = request.nextUrl.searchParams
    const cashierId = searchParams.get('cashierId')
    const paymentMethod = searchParams.get('paymentMethod')
    const paymentStatus = searchParams.get('paymentStatus')

    // Build date range for the entire day
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    // Build where clause
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (cashierId) {
      where.cashierId = cashierId
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    // Get transactions for the day
    const transactions = await db.transaction.findMany({
      where,
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
        shift: {
          select: {
            id: true,
            cashierName: true,
            openedAt: true
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
        createdAt: 'desc'
      }
    })

    // Calculate summary statistics
    const summary = {
      date: dateStr,
      totalTransactions: transactions.length,
      paidTransactions: 0,
      refundedTransactions: 0,
      totalSales: 0,
      cashSales: 0,
      nonCashSales: 0,
      totalDiscount: 0,
      totalTax: 0,
      avgTransactionAmount: 0,
      totalCashReceived: 0,
      totalChange: 0,
      paymentMethods: {} as Record<string, { count: number; amount: number }>,
      hourlyBreakdown: [] as Array<{
        hour: number
        count: number
        amount: number
      }>
    }

    // Initialize hourly breakdown (0-23 hours)
    for (let i = 0; i < 24; i++) {
      summary.hourlyBreakdown.push({
        hour: i,
        count: 0,
        amount: 0
      })
    }

    transactions.forEach(tx => {
      // Count by payment status
      if (tx.paymentStatus === 'PAID') {
        summary.paidTransactions++
      } else if (tx.paymentStatus === 'REFUNDED') {
        summary.refundedTransactions++
        return // Skip voided transactions from sales totals
      }

      summary.totalSales += tx.finalAmount
      summary.totalDiscount += tx.discountAmount
      summary.totalTax += tx.taxAmount

      if (tx.paymentMethod === 'CASH') {
        summary.cashSales += tx.finalAmount
        if (tx.cashReceived) {
          summary.totalCashReceived += tx.cashReceived
        }
        if (tx.changeAmount) {
          summary.totalChange += tx.changeAmount
        }
      } else {
        summary.nonCashSales += tx.finalAmount
      }

      // Track payment methods
      const method = tx.paymentMethod
      if (!summary.paymentMethods[method]) {
        summary.paymentMethods[method] = { count: 0, amount: 0 }
      }
      summary.paymentMethods[method].count++
      summary.paymentMethods[method].amount += tx.finalAmount

      // Update hourly breakdown
      const hour = tx.createdAt.getHours()
      summary.hourlyBreakdown[hour].count++
      summary.hourlyBreakdown[hour].amount += tx.finalAmount
    })

    // Calculate average (only for paid transactions)
    if (summary.paidTransactions > 0) {
      summary.avgTransactionAmount = summary.totalSales / summary.paidTransactions
    }

    // Get top selling products for the day
    const productSales: Record<string, { name: string; quantity: number; amount: number }> = {}

    transactions.forEach(tx => {
      if (tx.paymentStatus === 'REFUNDED') return

      tx.items.forEach(item => {
        const productName = item.product.name
        if (!productSales[productName]) {
          productSales[productName] = {
            name: productName,
            quantity: 0,
            amount: 0
          }
        }
        productSales[productName].quantity += item.quantity
        productSales[productName].amount += item.subtotal
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        date: dateStr,
        transactions,
        summary,
        topProducts
      }
    })
  } catch (error) {
    console.error('Error fetching daily transactions:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch daily transactions'
    }, { status: 500 })
  }
}
