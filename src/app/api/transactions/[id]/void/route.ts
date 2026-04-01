'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { VoidType } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Schema for voiding transaction
const voidTransactionSchema = z.object({
  supervisorEmail: z.string().email('Invalid supervisor email'),
  supervisorPin: z.string().min(1, 'Supervisor PIN is required'),
  reason: z.string().min(1, 'Void reason is required')
})

/**
 * POST /api/transactions/[id]/void
 * Void transaction (requires supervisor PIN)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate transaction ID
    const transactionId = params.id

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Transaction ID is required'
      }, { status: 400 })
    }

    const body = await request.json()

    // Validate request body
    const validatedData = voidTransactionSchema.parse(body)

    // Get transaction to void
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        cashier: true,
        member: true
      }
    })

    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 })
    }

    // Check if transaction is already voided
    if (transaction.paymentStatus === 'REFUNDED') {
      return NextResponse.json({
        success: false,
        error: 'Transaction is already voided'
      }, { status: 400 })
    }

    // Verify supervisor (ADMIN or MANAGER)
    const supervisor = await db.user.findUnique({
      where: { email: validatedData.supervisorEmail }
    })

    if (!supervisor) {
      return NextResponse.json({
        success: false,
        error: 'Supervisor not found'
      }, { status: 404 })
    }

    if (supervisor.role !== 'ADMIN' && supervisor.role !== 'MANAGER') {
      return NextResponse.json({
        success: false,
        error: 'User is not authorized as supervisor'
      }, { status: 403 })
    }

    // Verify supervisor PIN (using password as PIN for now)
    const isPinValid = await bcrypt.compare(
      validatedData.supervisorPin,
      supervisor.password
    )

    if (!isPinValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid supervisor PIN'
      }, { status: 401 })
    }

    // Perform void operation in a transaction
    const voidedTransaction = await db.$transaction(async (tx) => {
      // Update transaction payment status to REFUNDED
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          paymentStatus: 'REFUNDED'
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          cashier: true
        }
      })

      // Restore stock for all items
      for (const item of transaction.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })

        // Create stock log for restoration
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: 'IN',
            reason: `Stock restored from voided transaction #${transaction.transactionNo}`,
            reference: transaction.transactionNo
          }
        })
      }

      // Deduct points from member if points were earned
      if (transaction.memberId) {
        const pointsEarned = Math.floor(transaction.finalAmount / 1000)

        if (pointsEarned > 0) {
          await tx.member.update({
            where: { id: transaction.memberId },
            data: {
              points: {
                decrement: pointsEarned
              }
            }
          })

          await tx.pointHistory.create({
            data: {
              memberId: transaction.memberId,
              points: -pointsEarned,
              type: 'ADJUSTMENT',
              reference: transaction.transactionNo,
              notes: 'Points deducted due to voided transaction'
            }
          })
        }
      }

      // Update shift totals (subtract from sales)
      const isCashPayment = transaction.paymentMethod === 'CASH'
      await tx.cashierShift.update({
        where: { id: transaction.shiftId },
        data: {
          totalSales: {
            decrement: transaction.finalAmount
          },
          cashSales: isCashPayment ? { decrement: transaction.finalAmount } : undefined,
          nonCashSales: !isCashPayment ? { decrement: transaction.finalAmount } : undefined
        }
      })

      // Create void log
      await tx.voidLog.create({
        data: {
          transactionId: transaction.id,
          type: VoidType.TRANSACTION,
          reason: validatedData.reason,
          amount: transaction.finalAmount,
          supervisorPin: '***', // Don't store actual PIN
          cashierId: transaction.cashierId,
          cashierName: transaction.cashier.name
        }
      })

      return updatedTransaction
    })

    return NextResponse.json({
      success: true,
      message: 'Transaction voided successfully',
      data: {
        transactionId: voidedTransaction.id,
        transactionNo: voidedTransaction.transactionNo,
        voidedAt: new Date(),
        amount: voidedTransaction.finalAmount,
        reason: validatedData.reason,
        supervisor: {
          id: supervisor.id,
          name: supervisor.name,
          email: supervisor.email
        }
      }
    })
  } catch (error) {
    console.error('Error voiding transaction:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid void request data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to void transaction'
    }, { status: 500 })
  }
}
