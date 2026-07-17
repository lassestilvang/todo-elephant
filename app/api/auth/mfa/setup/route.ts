import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/user.model';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import QRCode from 'qrcode';

// POST /api/auth/mfa/setup - Generate MFA secret and QR code
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

    // Generate MFA secret using speakeasy
    const secret = user.generateMFASecret();
    await user.save();

    // Generate QR code URL (using otpauth format)
    const otpauthUrl = `otpauth://totp/TodoElephant:${user.email}?secret=${secret}&issuer=TodoElephant&algorithm=SHA1&digits=6&period=30`;
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    return NextResponse.json({
      secret,
      qrCodeUrl,
      otpauthUrl
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}