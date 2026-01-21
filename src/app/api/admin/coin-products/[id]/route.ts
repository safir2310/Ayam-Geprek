import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, coinsNeeded, photo } = body;

    if (!name || !coinsNeeded) {
      return NextResponse.json(
        { error: 'Nama dan jumlah koin harus diisi' },
        { status: 400 }
      );
    }

    const product = await db.coinExchangeProduct.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(coinsNeeded !== undefined && { coinsNeeded }),
        ...(photo !== undefined && { photo }),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating coin product:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.coinExchangeProduct.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting coin product:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
