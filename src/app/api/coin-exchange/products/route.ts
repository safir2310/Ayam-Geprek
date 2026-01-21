import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const products = await db.coinExchangeProduct.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching coin exchange products:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, coinsNeeded, photo } = body;

    if (!name || !coinsNeeded) {
      return NextResponse.json(
        { error: 'Nama dan jumlah koin harus diisi' },
        { status: 400 }
      );
    }

    const product = await db.coinExchangeProduct.create({
      data: {
        name,
        description,
        coinsNeeded,
        photo: photo || null,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating coin exchange product:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
