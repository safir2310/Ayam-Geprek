'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

// Query parameter validation schema
const profitQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  cashierId: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
})

/**
 * GET /api/reports/profit
 * Get profit/loss report
 * Query params:
 * - startDate: YYYY-MM-DD (default: 30 days ago)
 * - endDate: YYYY-MM-DD (default: today)
 * - cashierId: filter by specific cashier
 * - groupBy: 'day', 'week', or 'month' (default: 'day')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const queryResult = profitQuerySchema.safeParse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      cashierId: searchParams.get('cashierId') || undefined,
      groupBy: searchParams.get('groupBy') || 'day',
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

    const { startDate, endDate, cashierId, groupBy } = queryResult.data

    // Set default date range (last 30 days)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const defaultStartDate = new Date(today)
    defaultStartDate.setDate(defaultStartDate.getDate() - 29)
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
        not: 'REFUNDED',
      },
    }

    if (cashierId) {
      where.cashierId = cashierId
    }

    // Fetch transactions with items
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                cost: true,
                price: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Fetch online orders with items
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
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                cost: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Calculate profit/loss breakdown by group
    const breakdown: Record<
      string,
      {
        period: string
        revenue: number
        cost: number
        grossProfit: number
        grossMargin: number
        discount: number
        netRevenue: number
        netProfit: number
        netMargin: number
        transactionCount: number
        orderCount: number
        itemsSold: number
      }
    > = {}

    // Process transactions
    transactions.forEach((trx) => {
      const periodKey = getPeriodKey(trx.createdAt, groupBy)

      if (!breakdown[periodKey]) {
        breakdown[periodKey] = {
          period: periodKey,
          revenue: 0,
          cost: 0,
          grossProfit: 0,
          grossMargin: 0,
          discount: 0,
          netRevenue: 0,
          netProfit: 0,
          netMargin: 0,
          transactionCount: 0,
          orderCount: 0,
          itemsSold: 0,
        }
      }

      const period = breakdown[periodKey]
      period.transactionCount++
      period.discount += trx.discountAmount

      trx.items.forEach((item) => {
        const cost = item.cost || (item.product.cost || item.price * 0.6) * item.quantity
        const revenue = item.subtotal

        period.revenue += revenue
        period.cost += cost
        period.itemsSold += item.quantity
      })
    })

    // Process orders
    orders.forEach((order) => {
      const periodKey = getPeriodKey(order.createdAt, groupBy)

      if (!breakdown[periodKey]) {
        breakdown[periodKey] = {
          period: periodKey,
          revenue: 0,
          cost: 0,
          grossProfit: 0,
          grossMargin: 0,
          discount: 0,
          netRevenue: 0,
          netProfit: 0,
          netMargin: 0,
          transactionCount: 0,
          orderCount: 0,
          itemsSold: 0,
        }
      }

      const period = breakdown[periodKey]
      period.orderCount++
      period.discount += order.discountAmount

      order.items.forEach((item) => {
        const cost = (item.product.cost || item.price * 0.6) * item.quantity
        const revenue = item.subtotal

        period.revenue += revenue
        period.cost += cost
        period.itemsSold += item.quantity
      })
    })

    // Calculate profit metrics for each period
    Object.values(breakdown).forEach((period) => {
      period.grossProfit = period.revenue - period.cost
      period.grossMargin = period.revenue > 0 ? (period.grossProfit / period.revenue) * 100 : 0
      period.netRevenue = period.revenue - period.discount
      period.netProfit = period.netRevenue - period.cost
      period.netMargin = period.netRevenue > 0 ? (period.netProfit / period.netRevenue) * 100 : 0
    })

    // Calculate totals
    const totalRevenue = Object.values(breakdown).reduce((sum, p) => sum + p.revenue, 0)
    const totalCost = Object.values(breakdown).reduce((sum, p) => sum + p.cost, 0)
    const totalDiscount = Object.values(breakdown).reduce((sum, p) => sum + p.discount, 0)
    const grossProfit = totalRevenue - totalCost
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    const netRevenue = totalRevenue - totalDiscount
    const netProfit = netRevenue - totalCost
    const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0

    const totalTransactions = transactions.length
    const totalOrders = orders.length
    const totalItemsSold = Object.values(breakdown).reduce((sum, p) => sum + p.itemsSold, 0)

    // Product profitability
    const productProfitability: Record<
      string,
      {
        productId: string
        name: string
        quantity: number
        revenue: number
        cost: number
        profit: number
        margin: number
      }
    > = {}

    // Process transaction items for product profitability
    transactions.forEach((trx) => {
      trx.items.forEach((item) => {
        const productId = item.productId

        if (!productProfitability[productId]) {
          productProfitability[productId] = {
            productId,
            name: item.product.name,
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0,
          }
        }

        const cost = item.cost || (item.product.cost || item.price * 0.6) * item.quantity
        const revenue = item.subtotal

        productProfitability[productId].quantity += item.quantity
        productProfitability[productId].revenue += revenue
        productProfitability[productId].cost += cost
      })
    })

    // Process order items for product profitability
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId

        if (!productProfitability[productId]) {
          productProfitability[productId] = {
            productId,
            name: item.product.name,
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0,
          }
        }

        const cost = (item.product.cost || item.price * 0.6) * item.quantity
        const revenue = item.subtotal

        productProfitability[productId].quantity += item.quantity
        productProfitability[productId].revenue += revenue
        productProfitability[productId].cost += cost
      })
    })

    // Calculate profit and margin for each product
    Object.values(productProfitability).forEach((product) => {
      product.profit = product.revenue - product.cost
      product.margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0
    })

    // Sort products by profit
    const topProfitableProducts = Object.values(productProfitability)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)

    const lowMarginProducts = Object.values(productProfitability)
      .filter((p) => p.revenue > 0)
      .sort((a, b) => a.margin - b.margin)
      .slice(0, 10)

    // Payment method breakdown
    const paymentMethodBreakdown: Record<string, { count: number; revenue: number }> = {}

    transactions.forEach((trx) => {
      const method = trx.paymentMethod
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = { count: 0, revenue: 0 }
      }
      paymentMethodBreakdown[method].count++
      paymentMethodBreakdown[method].revenue += trx.finalAmount
    })

    orders.forEach((order) => {
      const method = order.paymentMethod
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = { count: 0, revenue: 0 }
      }
      paymentMethodBreakdown[method].count++
      paymentMethodBreakdown[method].revenue += order.totalAmount
    })

    // Compare with previous period for trends
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - daysDiff)
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)

    const previousTransactions = await prisma.transaction.findMany({
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
      include: {
        items: {
          include: {
            product: {
              select: { cost: true },
            },
          },
        },
      },
    })

    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: prevStart,
          lte: prevEnd,
        },
        status: {
          in: ['COMPLETED', 'DELIVERED'],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { cost: true },
            },
          },
        },
      },
    })

    let previousRevenue = 0
    let previousCost = 0

    previousTransactions.forEach((trx) => {
      trx.items.forEach((item) => {
        const cost = (item.cost || (item.product.cost || item.price * 0.6)) * item.quantity
        previousRevenue += item.subtotal
        previousCost += cost
      })
    })

    previousOrders.forEach((order) => {
      order.items.forEach((item) => {
        const cost = (item.product.cost || item.price * 0.6) * item.quantity
        previousRevenue += item.subtotal
        previousCost += cost
      })
    })

    const previousProfit = previousRevenue - previousCost
    const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const profitTrend = previousProfit > 0 ? ((netProfit - previousProfit) / previousProfit) * 100 : 0

    // Calculate average transaction values
    const avgTransactionValue = (totalTransactions + totalOrders) > 0
      ? totalRevenue / (totalTransactions + totalOrders)
      : 0
    const avgProfitPerTransaction = (totalTransactions + totalOrders) > 0
      ? netProfit / (totalTransactions + totalOrders)
      : 0

    return NextResponse.json(
      {
        success: true,
        data: {
          period: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
            days: daysDiff,
            groupBy,
          },
          summary: {
            totalRevenue: Math.round(totalRevenue),
            totalCost: Math.round(totalCost),
            totalDiscount: Math.round(totalDiscount),
            grossProfit: Math.round(grossProfit),
            grossMargin: Math.round(grossMargin * 100) / 100,
            netRevenue: Math.round(netRevenue),
            netProfit: Math.round(netProfit),
            netMargin: Math.round(netMargin * 100) / 100,
            totalTransactions,
            totalOrders,
            totalItemsSold,
            avgTransactionValue: Math.round(avgTransactionValue),
            avgProfitPerTransaction: Math.round(avgProfitPerTransaction),
            revenueTrend: Math.round(revenueTrend * 100) / 100,
            profitTrend: Math.round(profitTrend * 100) / 100,
          },
          breakdown: Object.values(breakdown).map((period) => ({
            ...period,
            revenue: Math.round(period.revenue),
            cost: Math.round(period.cost),
            grossProfit: Math.round(period.grossProfit),
            grossMargin: Math.round(period.grossMargin * 100) / 100,
            discount: Math.round(period.discount),
            netRevenue: Math.round(period.netRevenue),
            netProfit: Math.round(period.netProfit),
            netMargin: Math.round(period.netMargin * 100) / 100,
          })).sort((a, b) => a.period.localeCompare(b.period)),
          topProfitableProducts: topProfitableProducts.map((p) => ({
            productId: p.productId,
            name: p.name,
            quantitySold: p.quantity,
            revenue: Math.round(p.revenue),
            cost: Math.round(p.cost),
            profit: Math.round(p.profit),
            margin: Math.round(p.margin * 100) / 100,
          })),
          lowMarginProducts: lowMarginProducts.map((p) => ({
            productId: p.productId,
            name: p.name,
            quantitySold: p.quantity,
            revenue: Math.round(p.revenue),
            cost: Math.round(p.cost),
            profit: Math.round(p.profit),
            margin: Math.round(p.margin * 100) / 100,
          })),
          paymentMethodBreakdown: Object.entries(paymentMethodBreakdown).map(([method, data]) => ({
            method,
            count: data.count,
            revenue: Math.round(data.revenue),
            percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) / 100 : 0,
          })).sort((a, b) => b.revenue - a.revenue),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching profit report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch profit report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Helper function to get period key based on groupBy
function getPeriodKey(date: Date, groupBy: string): string {
  if (groupBy === 'day') {
    return date.toISOString().split('T')[0]
  } else if (groupBy === 'week') {
    const d = new Date(date)
    const dayOfWeek = d.getDay() || 7
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - dayOfWeek + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`
  } else if (groupBy === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
  return date.toISOString().split('T')[0]
}
