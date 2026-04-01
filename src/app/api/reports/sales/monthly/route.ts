'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

// Query parameter validation schema
const monthlySalesQuerySchema = z.object({
  year: z.string().optional(),
  month: z.string().optional(),
  cashierId: z.string().optional(),
})

/**
 * GET /api/reports/sales/monthly
 * Get monthly sales report
 * Query params:
 * - year: YYYY (default: current year)
 * - month: MM (1-12, default: current month)
 * - cashierId: filter by specific cashier
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const queryResult = monthlySalesQuerySchema.safeParse({
      year: searchParams.get('year') || undefined,
      month: searchParams.get('month') || undefined,
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

    const { year, month, cashierId } = queryResult.data

    // Get current date
    const now = new Date()
    const currentYear = year ? parseInt(year) : now.getFullYear()
    const currentMonth = month ? parseInt(month) : now.getMonth() + 1

    // Validate month
    if (currentMonth < 1 || currentMonth > 12) {
      return NextResponse.json(
        {
          success: false,
          error: 'Month must be between 1 and 12',
        },
        { status: 400 }
      )
    }

    // Calculate start and end of month
    const start = new Date(currentYear, currentMonth - 1, 1)
    start.setHours(0, 0, 0, 0)

    const end = new Date(currentYear, currentMonth, 0)
    end.setHours(23, 59, 59, 999)

    // Build where clause
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

    // Get number of days in month
    const daysInMonth = end.getDate()

    // Calculate daily breakdown
    const dailyBreakdown: Record<
      string,
      {
        date: string
        day: number
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

    // Initialize all days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      dailyBreakdown[dateKey] = {
        date: dateKey,
        day,
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

    // Calculate weekly breakdown (4 weeks)
    const weeklyBreakdown = []
    for (let week = 0; week < 4; week++) {
      const weekStart = week * 7 + 1
      const weekEnd = Math.min((week + 1) * 7, daysInMonth)

      let weekSales = 0
      let weekTransactions = 0
      let weekOrders = 0

      for (let day = weekStart; day <= weekEnd; day++) {
        const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayData = dailyBreakdown[dateKey]
        weekSales += dayData.totalSales
        weekTransactions += dayData.transactionCount
        weekOrders += dayData.orderCount
      }

      weeklyBreakdown.push({
        week: week + 1,
        start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(weekStart).padStart(2, '0')}`,
        end: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(weekEnd).padStart(2, '0')}`,
        totalSales: weekSales,
        totalTransactions: weekTransactions,
        totalOrders: weekOrders,
        avgDailySales: weekSales / (weekEnd - weekStart + 1),
      })
    }

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
    const avgDailySales = totalSales / daysInMonth

    // Calculate trends (compare with previous month)
    const prevMonthStart = new Date(currentYear, currentMonth - 2, 1)
    const prevMonthEnd = new Date(currentYear, currentMonth - 1, 0)
    prevMonthEnd.setHours(23, 59, 59, 999)

    const previousTransactions = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
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
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
        status: {
          in: ['COMPLETED', 'DELIVERED'],
        },
      },
    })

    const previousSales = (await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
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
          gte: prevMonthStart,
          lte: prevMonthEnd,
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

    // Best and worst performing days
    const sortedDays = Object.values(dailyBreakdown).filter(d => d.totalSales > 0).sort((a, b) => b.totalSales - a.totalSales)
    const bestDay = sortedDays[0]
    const worstDay = sortedDays[sortedDays.length - 1]

    return NextResponse.json(
      {
        success: true,
        data: {
          period: {
            year: currentYear,
            month: currentMonth,
            monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' }),
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            daysInMonth,
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
            avgDailySales,
            totalItemsSold,
            transactionTrend: Math.round(transactionTrend * 100) / 100,
            salesTrend: Math.round(salesTrend * 100) / 100,
            bestDay: bestDay ? {
              date: bestDay.date,
              sales: bestDay.totalSales,
              transactions: bestDay.transactionCount + bestDay.orderCount,
            } : null,
            worstDay: worstDay ? {
              date: worstDay.date,
              sales: worstDay.totalSales,
              transactions: worstDay.transactionCount + worstDay.orderCount,
            } : null,
          },
          dailyBreakdown: Object.values(dailyBreakdown),
          weeklyBreakdown,
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
    console.error('Error fetching monthly sales report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch monthly sales report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
