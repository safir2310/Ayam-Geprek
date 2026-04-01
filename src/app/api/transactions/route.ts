'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PaymentMethod, PaymentStatus } from '@/lib/enums'
import { z } from 'zod'
import { decrementProductStock, checkProductAvailability } from '@/lib/stock-manager'
import { broadcastNewTransaction } from '@/lib/websocket/client'

// Schema for creating a new POS transaction
const createTransactionSchema = z.object({
  cashierId: z.string().min(1, 'Cashier ID is required'),
  memberId: z.string().optional(),
  shiftId: z.string().min(1, 'Shift ID is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    price: z.number().min(0, 'Price must be positive'),
    discount: z.number().min(0).default(0),
    cost: z.number().min(0).optional()
  })).min(1, 'At least one item is required'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  cashReceived: z.number().min(0).optional(),
  notes: z.string().optional()
})

// Schema for transaction filters
const transactionFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  cashierId: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  memberId: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
})

/**
 * GET /api/transactions
 * Get all transactions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse and validate filters
    const filters = transactionFiltersSchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      cashierId: searchParams.get('cashierId'),
      paymentMethod: searchParams.get('paymentMethod'),
      paymentStatus: searchParams.get('paymentStatus'),
      memberId: searchParams.get('memberId'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })

    // Build where clause
    const where: any = {}

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate)
      }
    }

    if (filters.cashierId) {
      where.cashierId = filters.cashierId
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus
    }

    if (filters.memberId) {
      where.memberId = filters.memberId
    }

    if (filters.search) {
      where.OR = [
        { transactionNo: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
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
              status: true,
              openedAt: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  barcode: true
                }
              }
            }
          },
          payments: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: filters.limit
      }),
      db.transaction.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid filter parameters',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch transactions'
    }, { status: 500 })
  }
}

/**
 * POST /api/transactions
 * Create a new POS transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = createTransactionSchema.parse(body)

    // Validate cashier exists
    const cashier = await db.user.findUnique({
      where: { id: validatedData.cashierId }
    })

    if (!cashier) {
      return NextResponse.json({
        success: false,
        error: 'Cashier not found'
      }, { status: 404 })
    }

    // Validate member exists if provided
    if (validatedData.memberId) {
      const member = await db.member.findUnique({
        where: { id: validatedData.memberId }
      })

      if (!member) {
        return NextResponse.json({
          success: false,
          error: 'Member not found'
        }, { status: 404 })
      }
    }

    // Validate shift exists and is open
    const shift = await db.cashierShift.findUnique({
      where: { id: validatedData.shiftId }
    })

    if (!shift) {
      return NextResponse.json({
        success: false,
        error: 'Shift not found'
      }, { status: 404 })
    }

    if (shift.status !== 'OPEN') {
      return NextResponse.json({
        success: false,
        error: 'Shift is not open'
      }, { status: 400 })
    }

    // Check product availability
    const itemsToCheck = validatedData.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }))

    const availabilityCheck = await checkProductAvailability(itemsToCheck)

    if (!availabilityCheck.available) {
      return NextResponse.json({
        success: false,
        error: 'Some products are out of stock',
        unavailableItems: availabilityCheck.unavailableItems
      }, { status: 400 })
    }

    // Generate transaction number
    const transactionNo = `TRX-${Date.now().toString().slice(-8)}`

    // Calculate transaction totals
    let subtotal = 0
    const itemsWithSubtotal = validatedData.items.map(item => {
      const itemSubtotal = (item.price * item.quantity) - item.discount
      subtotal += itemSubtotal
      return {
        ...item,
        subtotal: itemSubtotal
      }
    })

    const totalAmount = subtotal
    const finalAmount = totalAmount - validatedData.discountAmount + validatedData.taxAmount

    // Calculate change amount for cash payments
    let changeAmount: number | undefined
    if (validatedData.paymentMethod === 'CASH' && validatedData.cashReceived) {
      changeAmount = validatedData.cashReceived - finalAmount
      if (changeAmount < 0) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient cash received'
        }, { status: 400 })
      }
    }

    // Create transaction with items in a transaction
    const transaction = await db.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          transactionNo,
          cashierId: validatedData.cashierId,
          memberId: validatedData.memberId,
          shiftId: validatedData.shiftId,
          totalAmount,
          discountAmount: validatedData.discountAmount,
          taxAmount: validatedData.taxAmount,
          finalAmount,
          paymentMethod: validatedData.paymentMethod,
          paymentStatus: PaymentStatus.PAID,
          cashReceived: validatedData.cashReceived,
          changeAmount,
          notes: validatedData.notes,
          items: {
            create: itemsWithSubtotal.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              subtotal: item.subtotal,
              cost: item.cost
            }))
          },
          payments: {
            create: {
              paymentMethod: validatedData.paymentMethod,
              amount: finalAmount,
              status: PaymentStatus.PAID
            }
          }
        },
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
              status: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  barcode: true
                }
              }
            }
          },
          payments: true
        }
      })

      // Update stock for each product
      for (const item of itemsWithSubtotal) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })

        // Create stock log
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity,
            type: 'OUT',
            reference: transactionNo,
            reason: `Transaction #${transactionNo}`
          }
        })
      }

      // Update shift totals
      const isCashPayment = validatedData.paymentMethod === 'CASH'
      await tx.cashierShift.update({
        where: { id: validatedData.shiftId },
        data: {
          totalSales: {
            increment: finalAmount
          },
          cashSales: isCashPayment ? { increment: finalAmount } : undefined,
          nonCashSales: !isCashPayment ? { increment: finalAmount } : undefined
        }
      })

      // Award points to member if applicable (1 point per 1000 spent)
      if (validatedData.memberId) {
        const pointsEarned = Math.floor(finalAmount / 1000)

        if (pointsEarned > 0) {
          await tx.member.update({
            where: { id: validatedData.memberId },
            data: {
              points: {
                increment: pointsEarned
              }
            }
          })

          await tx.pointHistory.create({
            data: {
              memberId: validatedData.memberId,
              points: pointsEarned,
              type: 'EARNED',
              reference: transactionNo,
              notes: 'Points earned from transaction'
            }
          })
        }
      }

      return newTransaction
    })

    // Broadcast new transaction via WebSocket
    broadcastNewTransaction({
      transactionId: transaction.id,
      transactionNo: transaction.transactionNo,
      amount: transaction.finalAmount,
      paymentMethod: transaction.paymentMethod,
      timestamp: transaction.createdAt
    })

    return NextResponse.json({
      success: true,
      data: transaction
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid transaction data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create transaction'
    }, { status: 500 })
  }
}
