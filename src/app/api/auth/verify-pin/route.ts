'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

// POST /api/auth/verify-pin - Verify supervisor PIN for void operations
export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { supervisorEmail, pin } = body;

    // Input validation
    if (!supervisorEmail || !pin) {
      return NextResponse.json(
        { success: false, error: 'Supervisor email and PIN are required' },
        { status: 400 }
      );
    }

    // Find supervisor by email
    const supervisor = await db.user.findUnique({
      where: { email: supervisorEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
      },
    });

    if (!supervisor) {
      return NextResponse.json(
        { success: false, error: 'Supervisor not found' },
        { status: 404 }
      );
    }

    // Check if user has supervisor role (ADMIN or MANAGER)
    if (supervisor.role !== 'ADMIN' && supervisor.role !== 'MANAGER') {
      return NextResponse.json(
        { success: false, error: 'User does not have supervisor privileges' },
        { status: 403 }
      );
    }

    // Verify PIN (using password hash for now, can be enhanced with separate PIN field)
    const isValidPin = await bcrypt.compare(pin, supervisor.password);

    if (!isValidPin) {
      return NextResponse.json(
        { success: false, error: 'Invalid supervisor PIN' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supervisor PIN verified successfully',
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        email: supervisor.email,
        role: supervisor.role,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Verify PIN error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
