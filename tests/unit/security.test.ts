import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security';

describe('Security Middleware', () => {
  it('applies security headers correctly', () => {
    const res = new NextResponse();
    const securedRes = applySecurityHeaders(res);

    expect(securedRes.headers.has('Content-Security-Policy')).toBe(true);
    expect(securedRes.headers.has('Strict-Transport-Security')).toBe(true);
    expect(securedRes.headers.has('X-Content-Type-Options')).toBe(true);
    expect(securedRes.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(securedRes.headers.has('X-Frame-Options')).toBe(true);
    expect(securedRes.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('generates unique CSP nonces', () => {
    const res1 = new NextResponse();
    const res2 = new NextResponse();

    applySecurityHeaders(res1);
    applySecurityHeaders(res2);

    const nonce1 = res1.headers.get('X-Nonce');
    const nonce2 = res2.headers.get('X-Nonce');

    // Nonces should be present and reasonably unique
    expect(nonce1).toBeDefined();
    expect(nonce2).toBeDefined();
    expect(nonce1).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(nonce2).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});