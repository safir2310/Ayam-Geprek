import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { db } from './db';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<{
  user: AuthenticatedUser | null;
  error?: string;
  status?: number;
}> {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return {
        user: null,
        error: 'Not authenticated',
        status: 401,
      };
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return {
        user: null,
        error: 'Invalid or expired token',
        status: 401,
      };
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return {
        user: null,
        error: 'User not found',
        status: 404,
      };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: 'Internal server error',
      status: 500,
    };
  }
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{
  user: AuthenticatedUser | null;
  error?: string;
  status?: number;
}> {
  const authResult = await getAuthenticatedUser(request);

  if (authResult.error) {
    return authResult;
  }

  if (!authResult.user) {
    return {
      user: null,
      error: 'User not found',
      status: 404,
    };
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      user: null,
      error: 'Insufficient permissions',
      status: 403,
    };
  }

  return { user: authResult.user };
}
