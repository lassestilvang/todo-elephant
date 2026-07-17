import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/user.model';
import { dbConnect } from '@/lib/db';

/**
 * POST /api/auth/mfa/verify
 * Verify MFA token during setup
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token || token.length < 6) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify MFA token
    const isValid = user.validateMFAToken(token);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid MFA token' }, { status: 401 });
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MFA verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}