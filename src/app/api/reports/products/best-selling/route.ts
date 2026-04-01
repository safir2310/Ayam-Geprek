'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

// Query parameter validation schema
const bestSellingQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  categoryId: z.string().optional(),
  sortBy: z.enum(['quantity', 'amount']).optional().default('quantity'),
})

/**
 * GET /api/reports/products/best-selling
 * Get best selling products report
 * Query params:
 * - startDate: YYYY-MM-DD (default: 30 days ago)
 * - endDate: YYYY-MM-DD (default: today)
 * - limit: number of results to return (default: 10)
 * - categoryId: filter by category
 * - sortBy: 'quantity' or 'amount' (default: 'quantity')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const queryResult = bestSellingQuerySchema.safeParse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      sortBy: searchParams.get('sortBy') || 'quantity',
    })

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.issues || [],
        },
        { status: 400 }
      )
    }

    const { startDate, endDate, limit, categoryId, sortBy } = queryResult.data

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

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit must be between 1 and 100',
        },
        { status: 400 }
      )
    }

    // Build where clauses
    const transactionWhere: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
      paymentStatus: {
        not: 'REFUNDED',
      },
    }

    const orderWhere: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
      status: {
        in: ['COMPLETED', 'DELIVERED'],
      },
    }

    // Fetch transaction items
    const transactionItems = await prisma.transactionItem.findMany({
      where: {
        transaction: transactionWhere,
        ...(categoryId && {
          product: {
            categoryId,
          },
        }),
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Fetch order items
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
        ...(categoryId && {
          product: {
            categoryId,
          },
        }),
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Aggregate product sales
    const productSales: Record<
      string,
      {
        productId: string
        name: string
        categoryName: string
        categoryId: string
        quantity: number
        amount: number
        discount: number
        avgPrice: number
        transactionCount: number
        orderCount: number
      }
    > = {}

    // Process transaction items
    transactionItems.forEach((item) => {
      const productId = item.productId

      if (!productSales[productId]) {
        productSales[productId] = {
          productId: item.product.id,
          name: item.product.name,
          categoryName: item.product.category.name,
          categoryId: item.product.category.id,
          quantity: 0,
          amount: 0,
          discount: 0,
          avgPrice: 0,
          transactionCount: 0,
          orderCount: 0,
        }
      }

      productSales[productId].quantity += item.quantity
      productSales[productId].amount += item.subtotal
      productSales[productId].discount += item.discount
      productSales[productId].transactionCount += 1
    })

    // Process order items
    orderItems.forEach((item) => {
      const productId = item.productId

      if (!productSales[productId]) {
        productSales[productId] = {
          productId: item.product.id,
          name: item.product.name,
          categoryName: item.product.category.name,
          categoryId: item.product.category.id,
          quantity: 0,
          amount: 0,
          discount: 0,
          avgPrice: 0,
          transactionCount: 0,
          orderCount: 0,
        }
      }

      productSales[productId].quantity += item.quantity
      productSales[productId].amount += item.subtotal
      productSales[productId].discount += item.discount
      productSales[productId].orderCount += 1
    })

    // Calculate average price
    Object.values(productSales).forEach((product) => {
      const totalQuantity = product.quantity
      product.avgPrice = totalQuantity > 0 ? product.amount / totalQuantity : 0
    })

    // Sort and limit results
    const sortedProducts = Object.values(productSales).sort((a, b) => {
      if (sortBy === 'quantity') {
        return b.quantity - a.quantity
      } else {
        return b.amount - a.amount
      }
    })

    const topProducts = sortedProducts.slice(0, limit)

    // Calculate summary statistics
    const totalProducts = Object.keys(productSales).length
    const totalQuantity = Object.values(productSales).reduce((sum, p) => sum + p.quantity, 0)
    const totalAmount = Object.values(productSales).reduce((sum, p) => sum + p.amount, 0)
    const avgQuantityPerProduct = totalProducts > 0 ? totalQuantity / totalProducts : 0
    const avgAmountPerProduct = totalProducts > 0 ? totalAmount / totalProducts : 0

    // Category breakdown
    const categoryBreakdown: Record<string, { name: string; quantity: number; amount: number; productCount: number }> = {}

    Object.values(productSales).forEach((product) => {
      const categoryId = product.categoryId

      if (!categoryBreakdown[categoryId]) {
        categoryBreakdown[categoryId] = {
          name: product.categoryName,
          quantity: 0,
          amount: 0,
          productCount: 0,
        }
      }

      categoryBreakdown[categoryId].quantity += product.quantity
      categoryBreakdown[categoryId].amount += product.amount
      categoryBreakdown[categoryId].productCount += 1
    })

    // Compare with previous period for trends
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - daysDiff)
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)

    const prevTransactionItems = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          createdAt: {
            gte: prevStart,
            lte: prevEnd,
          },
          paymentStatus: {
            not: 'REFUNDED',
          },
        },
        ...(categoryId && {
          product: {
            categoryId,
          },
        }),
      },
      include: {
        product: true,
      },
    })

    const prevOrderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: prevStart,
            lte: prevEnd,
          },
          status: {
            in: ['COMPLETED', 'DELIVERED'],
          },
        },
        ...(categoryId && {
          product: {
            categoryId,
          },
        }),
      },
      include: {
        product: true,
      },
    })

    const prevProductSales: Record<string, number> = {}
    prevTransactionItems.forEach((item) => {
      prevProductSales[item.productId] = (prevProductSales[item.productId] || 0) + item.quantity
    })
    prevOrderItems.forEach((item) => {
      prevProductSales[item.productId] = (prevProductSales[item.productId] || 0) + item.quantity
    })

    const prevTotalQuantity = Object.values(prevProductSales).reduce((sum, q) => sum + q, 0)
    const quantityTrend = prevTotalQuantity > 0
      ? ((totalQuantity - prevTotalQuantity) / prevTotalQuantity) * 100
      : 0

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
            totalProducts,
            totalQuantity,
            totalAmount,
            avgQuantityPerProduct,
            avgAmountPerProduct,
            quantityTrend: Math.round(quantityTrend * 100) / 100,
          },
          topProducts: topProducts.map((product) => ({
            productId: product.productId,
            name: product.name,
            category: product.categoryName,
            quantitySold: cat.quantity,
            totalAmount: product.amount,
            totalDiscount: product.discount,
            avgPrice: product.avgPrice,
            posOrders: product.transactionCount,
            onlineOrders: product.orderCount,
            totalOrders: product.transactionCount + product.orderCount,
            ...(prevProductSales[product.productId] !== undefined && {
              trend: prevProductSales[product.productId] > 0
                ? Math.round(((product.quantity - prevProductSales[product.productId]) / prevProductSales[product.productId]) * 100) / 100
                : product.quantity > 0 ? 100 : 0,
            }),
          })),
          categoryBreakdown: Object.values(categoryBreakdown).map((cat) => ({
            categoryId: Object.keys(categoryBreakdown).find(key => categoryBreakdown[key].name === cat.name) || '',
            name: cat.name,
            quantitySold: cat.quantity,
            totalAmount: cat.amount,
            productCount: cat.productCount,
            avgQuantityPerProduct: cat.productCount > 0 ? cat.quantity / cat.productCount : 0,
          })).sort((a, b) => b.quantity - a.quantity),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching best selling products report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch best selling products report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
