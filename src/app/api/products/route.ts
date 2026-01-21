import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, discount, category, photo, isPromotion, isNewest } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: 'Nama, harga, dan kategori harus diisi' },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        description,
        price,
        discount: discount || 0,
        category,
        photo: photo || null,
        isPromotion: isPromotion || false,
        isNewest: isNewest || false,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
