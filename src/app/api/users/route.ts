import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, address, photo, password } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (address !== undefined) updateData.address = address;
    if (photo !== undefined) updateData.photo = photo;
    if (password !== undefined) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
