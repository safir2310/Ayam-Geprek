import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status diperlukan' },
        { status: 400 }
      );
    }

    // Get the transaction first
    const existingTransaction = await db.transaction.findUnique({
      where: { id: params.id },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

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

    // If status is completed, add coins to user
    if (status === 'completed' && existingTransaction.status !== 'completed') {
      await db.user.update({
        where: { id: existingTransaction.userId },
        data: {
          coins: {
            increment: existingTransaction.coinsEarned,
          },
        },
      });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
