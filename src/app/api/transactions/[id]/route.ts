import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[TRANSACTION] PUT request received for ID:', params.id);

    const body = await request.json();
    const { status } = body;

    console.log('[TRANSACTION] New status:', status);

    if (!status) {
      console.log('[TRANSACTION] Status is missing in request body');
      return NextResponse.json(
        { error: 'Status diperlukan' },
        { status: 400 }
      );
    }

    // Get the transaction first
    const existingTransaction = await db.transaction.findUnique({
      where: { id: params.id },
    });

    console.log('[TRANSACTION] Existing transaction found:', !!existingTransaction);

    if (!existingTransaction) {
      console.log('[TRANSACTION] Transaction not found:', params.id);
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('[TRANSACTION] Current status:', existingTransaction.status);

    // Update transaction
    const transaction = await db.transaction.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'completed' && {
          completedAt: new Date(),
        }),
      },
    });

    console.log('[TRANSACTION] Transaction updated successfully');

    // If status is completed, add coins to user
    if (status === 'completed' && existingTransaction.status !== 'completed') {
      console.log('[TRANSACTION] Adding coins to user:', existingTransaction.coinsEarned);
      await db.user.update({
        where: { id: existingTransaction.userId },
        data: {
          coins: {
            increment: existingTransaction.coinsEarned,
          },
        },
      });
      console.log('[TRANSACTION] Coins added successfully');
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('[TRANSACTION] Error updating transaction:', error);
    if (error instanceof Error) {
      console.error('[TRANSACTION] Error name:', error.name);
      console.error('[TRANSACTION] Error message:', error.message);
      console.error('[TRANSACTION] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
