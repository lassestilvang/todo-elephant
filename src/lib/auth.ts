import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { UserModel } from '@/src/models/user.model';
import type { IUser } from '@/src/models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Token types
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

// Generate tokens
export function generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    type: 'access'
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

  const refreshPayload: TokenPayload = {
    ...payload,
    type: 'refresh'
  };

  const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return { accessToken, refreshToken };
}

// Verify token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Extract user from request
export async function getUserFromRequest(request: Request): Promise<IUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return null;

  return UserModel.findById(payload.userId);
}

// Auth middleware
export async function authMiddleware(request: Request): Promise<{ user: IUser | null; error?: Response }> {
  const user = await getUserFromRequest(request);

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  return { user };
}

// Role-based authorization
export function requireRole(...roles: string[]) {
  return (user: IUser | null) => {
    if (!user) return false;
    return roles.includes(user.role);
  };
}

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}