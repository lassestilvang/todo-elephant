import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/user.model';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';

// POST /api/auth/mfa/enable - Confirm MFA is enabled
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure MFA is enabled
    if (!user.mfaEnabled) {
      return NextResponse.json({ error: 'MFA not enabled' }, { status: 400 });
    }

    return NextResponse.json({ enabled: true });
  } catch (error) {
    console.error('MFA enable error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}