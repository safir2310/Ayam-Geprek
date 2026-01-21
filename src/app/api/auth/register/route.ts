import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Generate 4-digit user ID
function generateUserId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return num.toString().padStart(4, '0');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, username, password, email, phoneNumber, dateOfBirth, verificationCode } = body;

    if (!username || !password || !email || !phoneNumber) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah digunakan' },
        { status: 400 }
      );
    }

    // For admin registration, verify the verification code (date of birth)
    if (type === 'admin') {
      if (!dateOfBirth || !verificationCode) {
        return NextResponse.json(
          { error: 'Tanggal lahir dan kode verifikasi harus diisi' },
          { status: 400 }
        );
      }

      // Verification code should match the date of birth (DDMMYYYY format)
      const formattedDob = dateOfBirth.replace(/-/g, '');

      if (verificationCode !== formattedDob) {
        return NextResponse.json(
          { error: 'Kode verifikasi salah' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique 4-digit user ID
    let userId = generateUserId();
    let userIdExists = await db.user.findUnique({ where: { userId } });

    while (userIdExists) {
      userId = generateUserId();
      userIdExists = await db.user.findUnique({ where: { userId } });
    }

    // Create user
    const newUser = await db.user.create({
      data: {
        userId,
        username,
        password: hashedPassword,
        email,
        phoneNumber,
        role: type === 'admin' ? 'admin' : 'user',
        dateOfBirth: type === 'admin' ? dateOfBirth : null,
      },
    });

    return NextResponse.json({
      id: newUser.id,
      userId: newUser.userId,
      username: newUser.username,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
      role: newUser.role,
      coins: newUser.coins,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
