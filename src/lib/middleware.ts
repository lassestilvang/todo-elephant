import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyToken } from './auth';

/**
 * API Route Validation Middleware
 * Provides standardized input validation and error handling.
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validated = schema.parse(body);
      return NextResponse.next({
        headers: { 'x-validated': 'true' }
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  };
};

/**
 * Authentication middleware wrapper
 */
export const withAuth = (handler: Function) => {
  return async (request: NextRequest) => {
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(request);
  };
};

// Protected routes
const protectedRoutes = [
  '/api/tasks',
  '/api/lists',
  '/api/labels',
  '/api/filters',
  '/api/activity-logs',
  '/api/focus-sessions',
  '/api/shortcuts',
];

// Admin routes
const adminRoutes = [
  '/api/admin',
];

export async function authMiddleware(request: NextRequest): Promise<{ isAuthenticated: boolean; user?: any }> {
  const { nextUrl } = request;
  const isProtected = protectedRoutes.some(route => nextUrl.pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => nextUrl.pathname.startsWith(route));

  if (!isProtected && !isAdminRoute) {
    return { isAuthenticated: true };
  }

  // Get token from Authorization header or cookies
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return { isAuthenticated: false };
  }

  // Verify token
  const payload = verifyToken(token);
  if (!payload) {
    return { isAuthenticated: false };
  }

  return { isAuthenticated: true, user: payload };
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = `${ip}-${windowMs}`;

    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, count: 1 };
    }

    if (record.count >= maxRequests) {
      return { allowed: false, count: record.count };
    }

    record.count++;
    return { allowed: true, count: record.count };
  };
}