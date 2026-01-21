import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.coinExchangeProduct.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Produk tukar koin berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting coin exchange product:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
