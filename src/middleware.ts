// Elephant Security Middleware
// Implements authentication, rate limiting, and security headers

import { NextResponse, NextRequest } from 'next/server';
import { validateToken, rateLimitWebhookRequests, timingSafeEqual } from '@/api/utils/auth.utils';

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();

  // ---------- Security Headers ----------
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';"
  );

  // ---------- Rate Limiting (global) ----------
  // Exclude static assets and nextjs internals from rate limiting if desired
  const path = req.nextUrl.pathname;
  if (!path.startsWith('/_next/') && !path.startsWith('/api/')) {
    // Apply rate limiting to all other routes (including pages)
    const ip = req.headers.get('x-forwarded-for') ?? req.socket.remoteAddress ?? 'unknown';
    const rateConfig = { maxRequests: 100, windowMs: 15 * 60 * 1000 }; // 100 requests per 15 minutes
    if (!rateLimitWebhookRequests(ip, rateConfig)) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }
  }

  // ---------- Authentication for protected API routes ----------
  if (path.startsWith('/api/elephant/')) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = validateToken(req); // returns payload or null
    if (!decoded) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Attach user info to request for downstream handlers
    (req as any).userId = decoded.sub;
    (req as any).userEmail = decoded.email;
    (req as any).userRole = decoded.role;
  }

  return response;
}