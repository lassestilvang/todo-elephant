import { NextResponse } from 'next/server';
import { verifyToken, rateLimitWebhookRequests } from '@/lib/auth';
import { WebSocketServer } from 'ws';

let wsServer: WebSocketServer | null = null;

export function middleware(request: Request) {
  const authHeader = request.headers.get('authorization');
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-forwarded-for-forwarded-for') || request.headers.get('x-forwarded-for-forwarded-for') || request.headers.get('remote-address') || '127.0.0.1';

  // Apply rate limiting for API requests
  if (request.url.startsWith('/api/')) {
    if (!rateLimitWebhookRequests(ip)) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }
  }

  // Handle WebSocket connection upgrade
  if (request.headers.get('upgrade') === 'websocket') {
    const { socket, head } = request as any;
    if (wsServer) {
      wsServer.handleUpgrade(socket, head, (socket) => {
        wsServer!.emit('connection', socket, request);
      });
    }
    // Set up security headers for WebSocket
    const response = new NextResponse(JSON.stringify({ status: 'WebSocket connected' }));
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'authorization, content-type');
    return response;
  }

  // Security headers for all responses
  const response = NextResponse.next();
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block);
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy - adjust based on actual resources used
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; object-src 'none'; frame-ancestors 'none'",
  );

  return response;
}

// Initialize WebSocket server for connection upgrades
export function nextConnectConfig() {
  if (!wsServer) {
    wsServer = new WebSocketServer({ noServer: true });
    // WebSocket upgrade handling will be attached to the server
  }
  return { path: '/api/socket' };
}