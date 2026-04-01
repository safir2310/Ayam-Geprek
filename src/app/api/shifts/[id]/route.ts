'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/shifts/[id]
 * Get a single shift by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shiftId } = await params

    // Validate ID format (basic check)
    if (!shiftId || shiftId.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Invalid shift ID'
      }, { status: 400 })
    }

    const shift = await db.cashierShift.findUnique({
      where: { id: shiftId },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true
          }
        },
        transactions: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!shift) {
      return NextResponse.json({
        success: false,
        error: 'Shift not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: shift
    })
  } catch (error) {
    console.error('Error fetching shift:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch shift'
    }, { status: 500 })
  }
}
