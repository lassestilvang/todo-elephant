// Elephant Security Middleware
// Implements authentication, rate limiting, and security headers

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateToken } from '../api/utils/auth.utils';

// Rate limiting storage (in-memory, for demonstration)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  if (now > record.resetTime) {
    // Reset window
    ipRequestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

export async function middleware(req: NextRequest) {
  // Get path for validation
  const path = req.nextUrl.pathname;

  // Public paths that don't require auth
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
    '/_next/static/',
    '/_next/image/'
  ];

  // Check if path is public
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));

  // Apply rate limiting
  if (!isPublicPath) {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() :
               req.socket.remoteAddress || 'unknown';

    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests, please try again later' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor((ipRequestCounts.get(ip)?.resetTime || 0) / 1000))
          }
        }
      );
    }
  }

  // API routes that require authentication
  if (path.startsWith('/api/elephant') && !isPublicPath) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = validateToken(req); // Using our utility

    if (!decoded) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Store decoded token payload on request for downstream handlers
    (req as any).userId = decoded.sub;
    (req as any).userEmail = decoded.email;
    (req as any).userRole = decoded.role;
  }

  // Apply security headers
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");

  return