import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Clear refresh token cookie
  const response = NextResponse.json({ message: 'Logged out successfully' });

  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 0
  });

  return response;
}