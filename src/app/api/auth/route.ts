'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/jwt';

// POST /api/auth/register - Register new user
export async function POST(request: NextRequest) {
  console.log('[API] /api/auth POST called')
  try {
    const body = await request.json();
    const { name, email, password, role, phone, address } = body;

    console.log('Registration request:', { name, email, role, phone });

    // Input validation
    if (!name || !email || !password) {
      console.log('Validation failed: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format');
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 6) {
      console.log('Validation failed: Password too short');
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Role validation
    const validRoles = ['ADMIN', 'MANAGER', 'CASHIER', 'STAFF', 'USER'];
    const userRole = role || 'USER';
    
    // Log available roles for debugging
    console.log('Requesting role:', userRole);
    console.log('Valid roles:', validRoles);
    
    if (!validRoles.includes(userRole)) {
      console.log('Validation failed: Invalid role', role);
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with USER role
    console.log('Creating user with role:', userRole);
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole as any, // Type assertion to bypass Prisma cache issue
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    console.log('User created successfully:', user.id);

    // If registering as USER, also create a Member record
    if (user.role === 'USER') {
      console.log('Creating member record for user:', user.id);
      try {
        // Check if member already exists with this phone
        if (phone) {
          const existingMember = await db.member.findUnique({
            where: { phone },
          });

          if (!existingMember) {
            await db.member.create({
              data: {
                name,
                phone,
                email,
                address: address || null,
                points: 0,
                isActive: true,
              },
            });
            console.log('Member created successfully');
          } else {
            console.log('Member already exists with phone:', phone);
          }
        } else {
          console.log('No phone provided, skipping member creation');
        }
      } catch (memberError) {
        // Log but don't fail registration if member creation fails
        console.error('Error creating member record:', memberError);
      }
    }

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create response with token in HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user,
      token,
    }, { status: 201 });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('Registration completed successfully');
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/auth/login - Login user
export async function handleLogin(email: string, password: string) {
  try {
    // Input validation
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required',
        status: 400,
      };
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
        status: 401,
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid email or password',
        status: 401,
      };
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      status: 200,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Internal server error',
      status: 500,
    };
  }
}
