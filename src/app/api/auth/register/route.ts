import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Generate 4-digit user ID
function generateUserId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return num.toString().padStart(4, '0');
}

export async function POST(request: NextRequest) {
  console.log('[REGISTER] Registration attempt');

  try {
    const body = await request.json();
    console.log('[REGISTER] Request body:', { type: body.type, username: body.username, email: body.email });

    const { type, username, password, email, phoneNumber, dateOfBirth, verificationCode } = body;

    if (!username || !password || !email || !phoneNumber) {
      console.log('[REGISTER] Missing required fields');
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Check database connection
    console.log('[REGISTER] Testing database connection...');
    const testConnection = await db.user.count();
    console.log('[REGISTER] Database connection OK, total users:', testConnection);

    // Check if username already exists
    console.log('[REGISTER] Checking if username exists...');
    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log('[REGISTER] Username already exists:', username);
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Check if email already exists
    console.log('[REGISTER] Checking if email exists...');
    const existingEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      console.log('[REGISTER] Email already exists:', email);
      return NextResponse.json(
        { error: 'Email sudah digunakan' },
        { status: 400 }
      );
    }

    // For admin registration, verify the verification code (date of birth)
    if (type === 'admin') {
      if (!dateOfBirth || !verificationCode) {
        console.log('[REGISTER] Admin: Missing date of birth or verification code');
        return NextResponse.json(
          { error: 'Tanggal lahir dan kode verifikasi harus diisi' },
          { status: 400 }
        );
      }

      // Verification code should match the date of birth (DDMMYYYY format)
      const formattedDob = dateOfBirth.replace(/-/g, '');
      console.log('[REGISTER] Admin: Verifying code', { formattedDob, verificationCode });

      if (verificationCode !== formattedDob) {
        console.log('[REGISTER] Admin: Verification code mismatch');
        return NextResponse.json(
          { error: 'Kode verifikasi salah' },
          { status: 400 }
        );
      }
    }

    // Hash password
    console.log('[REGISTER] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique 4-digit user ID
    console.log('[REGISTER] Generating user ID...');
    let userId = generateUserId();
    let userIdExists = await db.user.findUnique({ where: { userId } });

    while (userIdExists) {
      userId = generateUserId();
      userIdExists = await db.user.findUnique({ where: { userId } });
    }

    console.log('[REGISTER] Generated user ID:', userId);

    // Create user
    console.log('[REGISTER] Creating user in database...');
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

    console.log('[REGISTER] User created successfully:', newUser.id);

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
    console.error('[REGISTER] ERROR:', error);
    console.error('[REGISTER] ERROR DETAILS:', JSON.stringify(error, null, 2));

    // Provide more detailed error message
    let errorMessage = 'Terjadi kesalahan server';

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[REGISTER] Error name:', error.name);
      console.error('[REGISTER] Error stack:', error.stack);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
