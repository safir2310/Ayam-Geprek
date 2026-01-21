import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const exchanges = await db.coinExchange.findMany({
      where: { userId },
      orderBy: { exchangedAt: 'desc' },
      include: {
        product: true,
      },
    });

    return NextResponse.json(exchanges);
  } catch (error) {
    console.error('Error fetching coin exchanges:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, productName, coinsSpent } = body;

    if (!userId || !productId || !coinsSpent) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Get user to check coin balance
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    if (user.coins < coinsSpent) {
      return NextResponse.json(
        { error: 'Koin tidak mencukupi' },
        { status: 400 }
      );
    }

    // Create coin exchange
    await db.coinExchange.create({
      data: {
        userId,
        productId,
        productName,
        coinsSpent,
      },
    });

    // Deduct coins from user
    await db.user.update({
      where: { id: userId },
      data: {
        coins: {
          decrement: coinsSpent,
        },
      },
    });

    return NextResponse.json({ message: 'Penukaran koin berhasil' });
  } catch (error) {
    console.error('Error exchanging coins:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
