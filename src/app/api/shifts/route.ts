'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ShiftStatus } from '@/lib/enums'
import { z } from 'zod'

// Schema for shift filters
const shiftFiltersSchema = z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  cashierId: z.string().optional(),
  cashierName: z.string().optional(),
  status: z.nativeEnum(ShiftStatus).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
})

/**
 * GET /api/shifts
 * Get all shifts with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse and validate filters
    const filters = shiftFiltersSchema.parse({
      date: searchParams.get('date'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      cashierId: searchParams.get('cashierId'),
      cashierName: searchParams.get('cashierName'),
      status: searchParams.get('status'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })

    // Build where clause
    const where: any = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.cashierId) {
      where.cashierId = filters.cashierId
    }

    if (filters.cashierName) {
      where.cashierName = {
        contains: filters.cashierName,
        mode: 'insensitive'
      }
    }

    if (filters.date) {
      const targetDate = new Date(filters.date)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      }
    } else if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate)
      }
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit

    // Get shifts with pagination
    const [shifts, total] = await Promise.all([
      db.cashierShift.findMany({
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
          _count: {
            select: {
              transactions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: filters.limit
      }),
      db.cashierShift.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: shifts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      }
    })
  } catch (error) {
    console.error('Error fetching shifts:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid filter parameters',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch shifts'
    }, { status: 500 })
  }
}
