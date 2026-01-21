import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Generate 4-digit receipt ID
function generateReceiptId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return num.toString().padStart(4, '0');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userIdNumber, userName, userPhoneNumber, items, totalAmount } = body;

    if (!userId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Data pesanan tidak lengkap' },
        { status: 400 }
      );
    }

    // Generate unique 4-digit receipt ID
    let receiptId = generateReceiptId();
    let receiptIdExists = await db.transaction.findUnique({ where: { receiptId } });

    while (receiptIdExists) {
      receiptId = generateReceiptId();
      receiptIdExists = await db.transaction.findUnique({ where: { receiptId } });
    }

    // Calculate coins (1 coin per 1000 rupiah)
    const coinsEarned = Math.floor(totalAmount / 1000);

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        receiptId,
        userId,
        userIdNumber,
        userName,
        userPhoneNumber,
        totalAmount,
        coinsEarned,
        status: 'waiting',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            productPhoto: item.productPhoto,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            subtotal: (item.price - item.price * (item.discount / 100)) * item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
