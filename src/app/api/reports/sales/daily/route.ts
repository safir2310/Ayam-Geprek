'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

// Query parameter validation schema
const dailySalesQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  cashierId: z.string().optional(),
})

/**
 * GET /api/reports/sales/daily
 * Get daily sales report with optional date range and cashier filter
 * Query params:
 * - startDate: YYYY-MM-DD (default: 7 days ago)
 * - endDate: YYYY-MM-DD (default: today)
 * - cashierId: filter by specific cashier
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const queryResult = dailySalesQuerySchema.safeParse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
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

    const { startDate, endDate, cashierId } = queryResult.data

    // Set default date range (last 7 days)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const defaultStartDate = new Date(today)
    defaultStartDate.setDate(defaultStartDate.getDate() - 6)
    defaultStartDate.setHours(0, 0, 0, 0)

    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : today
    end.setHours(23, 59, 59, 999)
    start.setHours(0, 0, 0, 0)

    // Validate date range
    if (start > end) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start date cannot be after end date',
        },
        { status: 400 }
      )
    }

    // Build where clause
    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
      paymentStatus: {
        not: 'REFUNDED', // Exclude refunded transactions
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
        shift: {
          select: {
            id: true,
            cashierName: true,
            openedAt: true,
            closedAt: true,
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

    // Fetch online orders within date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['COMPLETED', 'DELIVERED'], // Only completed/delivered orders
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
        uniqueCustomers: number
        paymentMethods: Record<string, { count: number; amount: number }>
      }
    > = {}

    // Process transactions
    transactions.forEach((trx) => {
      const dateKey = trx.createdAt.toISOString().split('T')[0]

      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = {
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
          uniqueCustomers: new Set<string>().size,
          paymentMethods: {},
        }
      }

      const day = dailyBreakdown[dateKey]
      day.transactionCount++
      day.totalSales += trx.finalAmount
      day.totalDiscount += trx.discountAmount
      day.totalTax += trx.taxAmount
      day.totalItemsSold += trx.items.reduce((sum, item) => sum + item.quantity, 0)

      // Track payment methods
      if (!day.paymentMethods[trx.paymentMethod]) {
        day.paymentMethods[trx.paymentMethod] = { count: 0, amount: 0 }
      }
      day.paymentMethods[trx.paymentMethod].count++
      day.paymentMethods[trx.paymentMethod].amount += trx.finalAmount

      // Cash vs non-cash
      if (trx.paymentMethod === 'CASH') {
        day.cashSales += trx.finalAmount
      } else {
        day.nonCashSales += trx.finalAmount
      }
    })

    // Process orders
    const customerSet = new Set<string>()
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0]

      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = {
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
          uniqueCustomers: 0,
          paymentMethods: {},
        }
      }

      const day = dailyBreakdown[dateKey]
      day.orderCount++
      day.totalSales += order.totalAmount
      day.totalDiscount += order.discountAmount
      day.totalItemsSold += order.items.reduce((sum, item) => sum + item.quantity, 0)

      // Track unique customers
      if (order.customerPhone) {
        customerSet.add(order.customerPhone)
      }

      // Track payment methods
      if (!day.paymentMethods[order.paymentMethod]) {
        day.paymentMethods[order.paymentMethod] = { count: 0, amount: 0 }
      }
      day.paymentMethods[order.paymentMethod].count++
      day.paymentMethods[order.paymentMethod].amount += order.totalAmount

      // Cash vs non-cash
      if (order.paymentMethod === 'CASH') {
        day.cashSales += order.totalAmount
      } else {
        day.nonCashSales += order.totalAmount
      }
    })

    // Calculate unique customers and average transaction amount
    const uniqueCustomersSet = new Set<string>()
    transactions.forEach((trx) => {
      if (trx.memberId) {
        uniqueCustomersSet.add(trx.memberId)
      }
    })
    orders.forEach((order) => {
      if (order.customerPhone) {
        uniqueCustomersSet.add(order.customerPhone)
      }
    })

    // Finalize daily breakdown
    Object.values(dailyBreakdown).forEach((day) => {
      const totalTransactions = day.transactionCount + day.orderCount
      day.avgTransactionAmount = totalTransactions > 0 ? day.totalSales / totalTransactions : 0
      day.uniqueCustomers = uniqueCustomersSet.size
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

    // Calculate trends (compare with previous period)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - daysDiff)
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)

    const previousTransactions = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: prevStart,
          lte: prevEnd,
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
          gte: prevStart,
          lte: prevEnd,
        },
        status: {
          in: ['COMPLETED', 'DELIVERED'],
        },
      },
    })

    const previousSales = (await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: prevStart,
          lte: prevEnd,
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
          gte: prevStart,
          lte: prevEnd,
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

    // Top selling products for the period
    const productSales: Record<string, { name: string; quantity: number; amount: number; category: string }> = {}

    transactions.forEach((trx) => {
      trx.items.forEach((item) => {
        const productId = item.productId
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            quantity: 0,
            amount: 0,
            category: item.product.category.name,
          }
        }
        productSales[productId].quantity += item.quantity
        productSales[productId].amount += item.subtotal
      })
    })

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            quantity: 0,
            amount: 0,
            category: item.product.category.name,
          }
        }
        productSales[productId].quantity += item.quantity
        productSales[productId].amount += item.subtotal
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

    // Hourly breakdown
    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
      amount: 0,
    }))

    transactions.forEach((trx) => {
      const hour = trx.createdAt.getHours()
      hourlyBreakdown[hour].count++
      hourlyBreakdown[hour].amount += trx.finalAmount
    })

    orders.forEach((order) => {
      const hour = order.createdAt.getHours()
      hourlyBreakdown[hour].count++
      hourlyBreakdown[hour].amount += order.totalAmount
    })

    // Calculate growth by day
    const dailyData = Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date))
    const dailyWithGrowth = dailyData.map((day, index) => {
      if (index === 0) {
        return { ...day, growthPercentage: 0 }
      }
      const prevDay = dailyData[index - 1]
      const growth = prevDay.totalSales > 0
        ? ((day.totalSales - prevDay.totalSales) / prevDay.totalSales) * 100
        : 0
      return { ...day, growthPercentage: growth }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          period: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
            days: daysDiff,
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
            uniqueCustomers: uniqueCustomersSet.size,
            transactionTrend: Math.round(transactionTrend * 100) / 100,
            salesTrend: Math.round(salesTrend * 100) / 100,
          },
          dailyBreakdown: dailyWithGrowth,
          hourlyBreakdown,
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
    console.error('Error fetching daily sales report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch daily sales report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
