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
    if (!validStatuses.includes(status)) {
      console.log('[TRANSACTION] Invalid status:', status);
      return NextResponse.json(
        { error: `Status tidak valid. Status yang valid: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

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
    }).catch((dbError) => {
      console.error('[TRANSACTION] Database error finding transaction:', dbError);
      throw new Error('Gagal mengambil data transaksi dari database');
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
    }).catch((dbError) => {
      console.error('[TRANSACTION] Database error updating transaction:', dbError);
      throw new Error('Gagal mengupdate status transaksi di database');
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
        // Continue even if coin addition fails
        // Transaction update was successful, just log the coin error
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
