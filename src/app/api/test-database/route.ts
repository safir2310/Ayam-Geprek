import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    console.log('[DB-TEST] Testing database connection...');

    // Count users
    const userCount = await db.user.count();
    console.log('[DB-TEST] Total users:', userCount);

    // Count products
    const productCount = await db.product.count();
    console.log('[DB-TEST] Total products:', productCount);

    // Count transactions
    const transactionCount = await db.transaction.count();
    console.log('[DB-TEST] Total transactions:', transactionCount);

    // Get latest transaction
    const latestTransaction = await db.transaction.findFirst({
      orderBy: { orderDate: 'desc' },
      include: {
        items: true,
        user: true,
      },
    });

    console.log('[DB-TEST] Latest transaction:', latestTransaction?.receiptId);

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        userCount,
        productCount,
        transactionCount,
        latestTransaction: latestTransaction ? {
          receiptId: latestTransaction.receiptId,
          userName: latestTransaction.userName,
          status: latestTransaction.status,
          totalAmount: latestTransaction.totalAmount,
          itemCount: latestTransaction.items.length,
        } : null,
      },
    });
  } catch (error) {
    console.error('[DB-TEST] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
