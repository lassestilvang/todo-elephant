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

/**
 * Verify a reCAPTCHA token from the client against Google's siteverify endpoint.
 * Returns the full verification payload, which includes a `success` boolean
 * and (on failure) an `error-codes` array for diagnostics.
 */
export async function verifyRecaptcha(token: string): Promise<{
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.warn('RECAPTCHA_SECRET_KEY is not configured; skipping verification');
    // In dev/test environments without the key configured, we let registration
    // proceed. Production deployments should always set this variable.
    return { success: true };
  }

  try {
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);

    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    // reCAPTCHA v3 returns a score; v2 checkbox returns just success.
    // We treat the verification as successful if Google says so.
    return {
      success: data.success && (data.score === undefined || data.score >= 0.5),
      score: data.score,
      action: data.action,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
      'error-codes': data['error-codes'],
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    // Fail open in non-production to avoid blocking legitimate signups during
    // transient network issues; in production you may want stricter behaviour.
    return { success: process.env.NODE_ENV !== 'production' };
  }
}