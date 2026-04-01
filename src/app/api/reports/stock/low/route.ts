'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

// Query parameter validation schema
const lowStockQuerySchema = z.object({
  threshold: z.string().optional().transform((val) => val ? parseInt(val) : null),
  includeInactive: z.string().optional().transform((val) => val === 'true'),
})

/**
 * GET /api/reports/stock/low
 * Get low stock products report
 * Query params:
 * - threshold: override minStock threshold (optional)
 * - includeInactive: include inactive products (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const queryResult = lowStockQuerySchema.safeParse({
      threshold: searchParams.get('threshold') || undefined,
      includeInactive: searchParams.get('includeInactive') || undefined,
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

    const { threshold, includeInactive } = queryResult.data

    // Build where clause
    const where: any = {}

    if (!includeInactive) {
      where.isActive = true
    }

    // Fetch products
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        stock: 'asc',
      },
    })

    // Filter and categorize low stock products
    const lowStockProducts = products
      .map((product) => {
        const effectiveMinStock = threshold !== null ? threshold : product.minStock
        const stockDifference = product.stock - effectiveMinStock
        let status: 'out-of-stock' | 'low-stock' | 'near-low-stock' | 'in-stock'

        if (product.stock === 0) {
          status = 'out-of-stock'
        } else if (product.stock < effectiveMinStock) {
          status = 'low-stock'
        } else if (product.stock === effectiveMinStock) {
          status = 'near-low-stock'
        } else {
          status = 'in-stock'
        }

        return {
          ...product,
          effectiveMinStock,
          stockDifference,
          status,
        }
      })
      .filter((product) => {
        const effectiveMinStock = threshold !== null ? threshold : product.minStock
        return product.stock <= effectiveMinStock
      })
      .sort((a, b) => {
        // Sort by stock level ascending, then by status severity
        const statusPriority = { 'out-of-stock': 0, 'low-stock': 1, 'near-low-stock': 2 }
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 3
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 3

        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }

        return a.stock - b.stock
      })

    // Get recent stock logs for low stock products
    const lowStockProductIds = lowStockProducts.map((p) => p.id)
    const recentStockLogs = await prisma.stockLog.findMany({
      where: {
        productId: {
          in: lowStockProductIds,
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    // Calculate summary statistics
    const outOfStockCount = lowStockProducts.filter((p) => p.status === 'out-of-stock').length
    const lowStockCount = lowStockProducts.filter((p) => p.status === 'low-stock').length
    const nearLowStockCount = lowStockProducts.filter((p) => p.status === 'near-low-stock').length

    const totalProducts = products.length
    const healthyStockCount = totalProducts - lowStockProducts.length

    // Calculate total value of low stock items
    const totalStockValue = lowStockProducts.reduce((sum, p) => {
      const cost = p.cost || p.price * 0.6 // Estimate cost if not available (60% of price)
      return sum + (p.stock * cost)
    }, 0)

    const totalRestockCost = lowStockProducts.reduce((sum, p) => {
      const effectiveMinStock = threshold !== null ? threshold : p.minStock
      const needed = Math.max(0, effectiveMinStock - p.stock)
      const cost = p.cost || p.price * 0.6
      return sum + (needed * cost)
    }, 0)

    // Category breakdown
    const categoryBreakdown: Record<string, { name: string; count: number; outOfStock: number; lowStock: number }> = {}

    lowStockProducts.forEach((product) => {
      const categoryId = product.category.id

      if (!categoryBreakdown[categoryId]) {
        categoryBreakdown[categoryId] = {
          name: product.category.name,
          count: 0,
          outOfStock: 0,
          lowStock: 0,
        }
      }

      categoryBreakdown[categoryId].count++
      if (product.status === 'out-of-stock') {
        categoryBreakdown[categoryId].outOfStock++
      } else if (product.status === 'low-stock') {
        categoryBreakdown[categoryId].lowStock++
      }
    })

    // Products that need immediate attention (out of stock)
    const criticalProducts = lowStockProducts.filter((p) => p.status === 'out-of-stock')

    // Calculate trends (compare with 30 days ago)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const stockLogs30DaysAgo = await prisma.stockLog.findMany({
      where: {
        createdAt: {
          lte: thirtyDaysAgo,
        },
        type: 'OUT',
      },
      select: {
        productId: true,
        quantity: true,
      },
    })

    const stockUsage30DaysAgo: Record<string, number> = {}
    stockLogs30DaysAgo.forEach((log) => {
      stockUsage30DaysAgo[log.productId] = (stockUsage30DaysAgo[log.productId] || 0) + log.quantity
    })

    // Estimate days until stockout
    const productsWithDaysUntilStockout = lowStockProducts
      .filter((p) => p.stock > 0 && stockUsage30DaysAgo[p.id] > 0)
      .map((product) => {
        const dailyUsage = stockUsage30DaysAgo[product.id] / 30
        const daysUntilStockout = dailyUsage > 0 ? Math.floor(product.stock / dailyUsage) : Infinity
        return {
          productId: product.id,
          name: product.name,
          currentStock: product.stock,
          dailyUsage: Math.round(dailyUsage * 100) / 100,
          daysUntilStockout,
        }
      })
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
      .slice(0, 10)

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            totalProducts,
            lowStockProducts: lowStockProducts.length,
            outOfStockCount,
            lowStockCount,
            nearLowStockCount,
            healthyStockCount,
            totalStockValue: Math.round(totalStockValue),
            estimatedRestockCost: Math.round(totalRestockCost),
            thresholdUsed: threshold !== null ? threshold : 'product-specific',
          },
          criticalProducts: criticalProducts.map((p) => ({
            productId: p.id,
            name: p.name,
            category: p.category.name,
            currentStock: p.stock,
            minStock: p.minStock,
            needed: threshold !== null ? threshold : p.minStock,
            price: p.price,
            cost: p.cost,
            status: p.status,
          })),
          lowStockProducts: lowStockProducts.map((p) => ({
            productId: p.id,
            name: p.name,
            category: p.category.name,
            currentStock: p.stock,
            minStock: p.minStock,
            stockDifference: p.stockDifference,
            price: p.price,
            cost: p.cost,
            status: p.status,
            stockValue: Math.round((p.cost || p.price * 0.6) * p.stock),
            restockNeeded: Math.max(0, p.effectiveMinStock - p.stock),
            estimatedRestockCost: Math.round((p.cost || p.price * 0.6) * Math.max(0, p.effectiveMinStock - p.stock)),
          })),
          categoryBreakdown: Object.values(categoryBreakdown).map((cat) => ({
            categoryId: Object.keys(categoryBreakdown).find(key => categoryBreakdown[key].name === cat.name) || '',
            name: cat.name,
            count: cat.count,
            outOfStock: cat.outOfStock,
            lowStock: cat.lowStock,
            severity: cat.outOfStock > 0 ? 'critical' : cat.lowStock > 0 ? 'warning' : 'info',
          })).sort((a, b) => b.count - a.count),
          productsWithDaysUntilStockout,
          recentStockLogs: recentStockLogs.map((log) => ({
            id: log.id,
            productId: log.productId,
            productName: log.product.name,
            quantity: log.quantity,
            type: log.type,
            reason: log.reason,
            reference: log.reference,
            createdAt: log.createdAt,
          })),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching low stock report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch low stock report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
