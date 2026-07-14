import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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