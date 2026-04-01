'use server';

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

/**
 * GET /api/transactions/[id]
 * Get single transaction by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to get actual values
    const { id: transactionId } = await params

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Transaction ID is required'
      }, { status: 400 })
    }

    // Get transaction by ID
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
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
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            points: true
          }
        },
        shift: {
          select: {
            id: true,
            cashierName: true,
            openingBalance: true,
            closingBalance: true,
            totalSales: true,
            status: true,
            openedAt: true,
            closedAt: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                barcode: true,
                sku: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        payments: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            customerName: true,
            customerPhone: true,
            customerAddress: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: transaction
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch transaction'
    }, { status: 500 })
  }
}
