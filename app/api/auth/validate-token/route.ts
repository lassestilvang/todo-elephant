import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const payload = verifyToken(token);

    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}