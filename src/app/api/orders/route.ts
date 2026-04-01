'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/lib/enums'
import { broadcastNewOrder, broadcastOrderUpdated } from '@/lib/websocket/client'

// Schema for creating a new order
const createOrderSchema = z.object({
  memberId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerAddress: z.string().min(1, 'Customer address is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    price: z.number().min(0, 'Price must be positive'),
    discount: z.number().min(0).default(0)
  })).min(1, 'At least one item is required'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
  pointsUsed: z.number().int().min(0).default(0)
})

// Schema for order filters
const orderFiltersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
})

/**
 * GET /api/orders
 * Get all orders with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse and validate filters
    const filters = orderFiltersSchema.parse({
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })

    // Build where clause
    const where: any = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate)
      }
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerPhone: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              points: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: filters.limit
      }),
      db.order.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid filter parameters',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders'
    }, { status: 500 })
  }
}

/**
 * POST /api/orders
 * Create a new online order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = createOrderSchema.parse(body)

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`

    // Calculate order totals
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

    // Deduct points from member if provided
    if (validatedData.memberId && validatedData.pointsUsed > 0) {
      const member = await db.member.findUnique({
        where: { id: validatedData.memberId }
      })

      if (!member) {
        return NextResponse.json({
          success: false,
          error: 'Member not found'
        }, { status: 404 })
      }

      if (member.points < validatedData.pointsUsed) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient member points'
        }, { status: 400 })
      }

      // Deduct points
      await db.member.update({
        where: { id: validatedData.memberId },
        data: {
          points: {
            decrement: validatedData.pointsUsed
          }
        }
      })

      // Log point usage
      await db.pointHistory.create({
        data: {
          memberId: validatedData.memberId,
          points: -validatedData.pointsUsed,
          type: 'REDEEMED',
          reference: orderNumber,
          notes: 'Points used for order'
        }
      })
    }

    // Calculate points earned (1 point per 1000 spent)
    const pointsEarned = Math.floor(totalAmount / 1000)

    // Create order with items in a transaction
    const order = await db.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          memberId: validatedData.memberId,
          customerName: validatedData.customerName,
          customerPhone: validatedData.customerPhone,
          customerAddress: validatedData.customerAddress,
          status: OrderStatus.PENDING,
          totalAmount,
          discountAmount: 0,
          pointsUsed: validatedData.pointsUsed,
          pointsEarned,
          paymentMethod: validatedData.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          notes: validatedData.notes,
          items: {
            create: itemsWithSubtotal.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              subtotal: item.subtotal
            }))
          }
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              points: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        }
      })

      // Add points to member if earned
      if (pointsEarned > 0 && validatedData.memberId) {
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
            reference: orderNumber,
            notes: 'Points earned from order'
          }
        })
      }

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
            reference: orderNumber,
            reason: `Order #${orderNumber}`
          }
        })
      }

      return newOrder
    })

    // Broadcast new order via WebSocket
    broadcastNewOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
      total: order.totalAmount,
      status: order.status,
      timestamp: order.createdAt
    })

    return NextResponse.json({
      success: true,
      data: order
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create order'
    }, { status: 500 })
  }
}
