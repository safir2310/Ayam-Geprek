'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

// Query parameter validation schema
const weeklySalesQuerySchema = z.object({
  weekStart: z.string().optional(),
  cashierId: z.string().optional(),
})

/**
 * GET /api/reports/sales/weekly
 * Get weekly sales report
 * Query params:
 * - weekStart: YYYY-MM-DD (default: start of current week)
 * - cashierId: filter by specific cashier
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const queryResult = weeklySalesQuerySchema.safeParse({
      weekStart: searchParams.get('weekStart') || undefined,
      cashierId: searchParams.get('cashierId') || undefined,
    })

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { weekStart, cashierId } = queryResult.data

    // Get current date and calculate week start (Monday)
    const today = new Date()
    const dayOfWeek = today.getDay() || 7 // Make Sunday = 7

    let start: Date
    if (weekStart) {
      start = new Date(weekStart)
    } else {
      start = new Date(today)
      start.setDate(start.getDate() - dayOfWeek + 1) // Go back to Monday
    }
    start.setHours(0, 0, 0, 0)

    // Calculate week end (Sunday)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    // Build where clause for transactions
    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
      paymentStatus: {
        not: 'REFUNDED',
      },
    }

    if (cashierId) {
      where.cashierId = cashierId
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Fetch online orders
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['COMPLETED', 'DELIVERED'],
        },
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Calculate daily breakdown
    const dailyBreakdown: Record<
      string,
      {
        dayName: string
        date: string
        transactionCount: number
        orderCount: number
        totalSales: number
        cashSales: number
        nonCashSales: number
        totalDiscount: number
        totalTax: number
        avgTransactionAmount: number
        totalItemsSold: number
        paymentMethods: Record<string, { count: number; amount: number }>
      }
    > = {}

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start)
      currentDate.setDate(currentDate.getDate() + i)
      const dateKey = currentDate.toISOString().split('T')[0]
      const dayName = dayNames[currentDate.getDay()]

      dailyBreakdown[dateKey] = {
        dayName,
        date: dateKey,
        transactionCount: 0,
        orderCount: 0,
        totalSales: 0,
        cashSales: 0,
        nonCashSales: 0,
        totalDiscount: 0,
        totalTax: 0,
        avgTransactionAmount: 0,
        totalItemsSold: 0,
        paymentMethods: {},
      }
    }

    // Process transactions
    transactions.forEach((trx) => {
      const dateKey = trx.createdAt.toISOString().split('T')[0]

      if (dailyBreakdown[dateKey]) {
        const day = dailyBreakdown[dateKey]
        day.transactionCount++
        day.totalSales += trx.finalAmount
        day.totalDiscount += trx.discountAmount
        day.totalTax += trx.taxAmount
        day.totalItemsSold += trx.items.reduce((sum, item) => sum + item.quantity, 0)

        if (!day.paymentMethods[trx.paymentMethod]) {
          day.paymentMethods[trx.paymentMethod] = { count: 0, amount: 0 }
        }
        day.paymentMethods[trx.paymentMethod].count++
        day.paymentMethods[trx.paymentMethod].amount += trx.finalAmount

        if (trx.paymentMethod === 'CASH') {
          day.cashSales += trx.finalAmount
        } else {
          day.nonCashSales += trx.finalAmount
        }
      }
    })

    // Process orders
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0]

      if (dailyBreakdown[dateKey]) {
        const day = dailyBreakdown[dateKey]
        day.orderCount++
        day.totalSales += order.totalAmount
        day.totalDiscount += order.discountAmount
        day.totalItemsSold += order.items.reduce((sum, item) => sum + item.quantity, 0)

        if (!day.paymentMethods[order.paymentMethod]) {
          day.paymentMethods[order.paymentMethod] = { count: 0, amount: 0 }
        }
        day.paymentMethods[order.paymentMethod].count++
        day.paymentMethods[order.paymentMethod].amount += order.totalAmount

        if (order.paymentMethod === 'CASH') {
          day.cashSales += order.totalAmount
        } else {
          day.nonCashSales += order.totalAmount
        }
      }
    })

    // Calculate average transaction amounts
    Object.values(dailyBreakdown).forEach((day) => {
      const totalTransactions = day.transactionCount + day.orderCount
      day.avgTransactionAmount = totalTransactions > 0 ? day.totalSales / totalTransactions : 0
    })

    // Calculate totals
    const totalTransactions = transactions.length
    const totalOrders = orders.length
    const totalSales = transactions.reduce((sum, trx) => sum + trx.finalAmount, 0) +
                      orders.reduce((sum, ord) => sum + ord.totalAmount, 0)
    const totalDiscount = transactions.reduce((sum, trx) => sum + trx.discountAmount, 0) +
                         orders.reduce((sum, ord) => sum + ord.discountAmount, 0)
    const totalTax = transactions.reduce((sum, trx) => sum + trx.taxAmount, 0)
    const totalCashSales = Object.values(dailyBreakdown).reduce((sum, day) => sum + day.cashSales, 0)
    const totalNonCashSales = Object.values(dailyBreakdown).reduce((sum, day) => sum + day.nonCashSales, 0)
    const totalItemsSold = Object.values(dailyBreakdown).reduce((sum, day) => sum + day.totalItemsSold, 0)
    const avgTransactionAmount = (totalTransactions + totalOrders) > 0
      ? totalSales / (totalTransactions + totalOrders)
      : 0

    // Calculate trends (compare with previous week)
    const prevWeekStart = new Date(start)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    const prevWeekEnd = new Date(start)
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1)

    const previousTransactions = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: prevWeekStart,
          lte: prevWeekEnd,
        },
        paymentStatus: {
          not: 'REFUNDED',
        },
        ...(cashierId && { cashierId }),
      },
    })

    const previousOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: prevWeekStart,
          lte: prevWeekEnd,
        },
        status: {
          in: ['COMPLETED', 'DELIVERED'],
        },
      },
    })

    const previousSales = (await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: prevWeekStart,
          lte: prevWeekEnd,
        },
        paymentStatus: {
          not: 'REFUNDED',
        },
        ...(cashierId && { cashierId }),
      },
      select: { finalAmount: true },
    })).reduce((sum, trx) => sum + trx.finalAmount, 0) +
    (await prisma.order.findMany({
      where: {
        createdAt: {
          gte: prevWeekStart,
          lte: prevWeekEnd,
        },
        status: {
          in: ['COMPLETED', 'DELIVERED'],
        },
      },
      select: { totalAmount: true },
    })).reduce((sum, ord) => sum + ord.totalAmount, 0)

    const transactionTrend = (previousTransactions + previousOrders) > 0
      ? ((totalTransactions + totalOrders - (previousTransactions + previousOrders)) / (previousTransactions + previousOrders)) * 100
      : 0

    const salesTrend = previousSales > 0
      ? ((totalSales - previousSales) / previousSales) * 100
      : 0

    // Top selling products
    const productSales: Record<string, { name: string; quantity: number; amount: number; category: string }> = {}

    transactions.forEach((trx) => {
      trx.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            amount: 0,
            category: item.product.category.name,
          }
        }
        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].amount += item.subtotal
      })
    })

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            amount: 0,
            category: item.product.category.name,
          }
        }
        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].amount += item.subtotal
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((product) => ({
        name: product.name,
        category: product.category,
        quantitySold: product.quantity,
        totalAmount: product.amount,
      }))

    // Best performing day
    const bestDay = Object.values(dailyBreakdown).sort((a, b) => b.totalSales - a.totalSales)[0]
    const worstDay = Object.values(dailyBreakdown).sort((a, b) => a.totalSales - b.totalSales)[0]

    return NextResponse.json(
      {
        success: true,
        data: {
          period: {
            weekStart: start.toISOString().split('T')[0],
            weekEnd: end.toISOString().split('T')[0],
            weekNumber: Math.ceil(start.getDate() / 7),
          },
          summary: {
            totalTransactions,
            totalOrders,
            totalSales,
            totalDiscount,
            totalTax,
            cashSales: totalCashSales,
            nonCashSales: totalNonCashSales,
            avgTransactionAmount,
            totalItemsSold,
            avgDailySales: totalSales / 7,
            transactionTrend: Math.round(transactionTrend * 100) / 100,
            salesTrend: Math.round(salesTrend * 100) / 100,
            bestDay: {
              day: bestDay?.dayName || 'N/A',
              sales: bestDay?.totalSales || 0,
            },
            worstDay: {
              day: worstDay?.dayName || 'N/A',
              sales: worstDay?.totalSales || 0,
            },
          },
          dailyBreakdown: Object.values(dailyBreakdown),
          topProducts,
          paymentMethods: Object.values(dailyBreakdown).reduce((acc, day) => {
            Object.entries(day.paymentMethods).forEach(([method, data]) => {
              if (!acc[method]) {
                acc[method] = { count: 0, amount: 0 }
              }
              acc[method].count += data.count
              acc[method].amount += data.amount
            })
            return acc
          }, {} as Record<string, { count: number; amount: number }>),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching weekly sales report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weekly sales report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
