import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Content-Security-Policy header with dynamic nonce
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const nonce = crypto.randomBytes(16).toString('base64');
  const policy = `
    default-src 'self';
    script-src 'self' 'nonce-${nonces}';
    style-src 'self' 'unsafe-inline' 'nonce-${nonces}';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self';
    frame-ancestors 'none';
  `.replace(/<nonces>/g, nonce);

  response.headers.set('Content-Security-Policy', policy);
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}