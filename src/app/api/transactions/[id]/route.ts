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

    // Validate status value
    const validStatuses = ['waiting', 'approved', 'processing', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      console.log('[TRANSACTION] Invalid or missing status:', status);
      return NextResponse.json(
        { error: 'Status tidak valid. Status yang valid: waiting, approved, processing, completed, cancelled' },
        { status: 400 }
      );
    }

    // Get transaction first
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
    console.log('[TRANSACTION] Coins earned:', existingTransaction.coinsEarned);
    console.log('[TRANSACTION] User ID:', existingTransaction.userId);

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
      try {
        // Validate coinsEarned before adding
        const coinsToAdd = existingTransaction.coinsEarned || 0;

        if (coinsToAdd > 0) {
          console.log('[TRANSACTION] Adding coins to user:', coinsToAdd);
          await db.user.update({
            where: { id: existingTransaction.userId },
            data: {
              coins: {
                increment: coinsToAdd,
              },
            },
          });
          console.log('[TRANSACTION] Coins added successfully');
        } else {
          console.log('[TRANSACTION] No coins to add (coinsEarned is 0 or null)');
        }
      } catch (coinError) {
        console.error('[TRANSACTION] Error adding coins:', coinError);
        // Continue even if coin addition fails - transaction update was successful
        // Just log the error, don't fail the whole request
      }
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
