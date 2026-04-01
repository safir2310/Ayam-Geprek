'use server';

import { NextRequest, NextResponse } from 'next/server';
import { handleLogin } from '../route';

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Call login handler
    const result = await handleLogin(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    // Create response with token in HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
      token: result.token,
    }, { status: result.status });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
