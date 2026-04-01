'use server';

import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/logout - Logout user
export async function POST(request: NextRequest) {
  try {
    // Create response that clears the auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    }, { status: 200 });

    // Clear the HTTP-only cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
