// JWT Authentication Utilities
// Manages token generation, validation, and refresh functionality

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-testing';
const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Token generation
const generateAccessToken = (user: any) => {
  return jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role || 'user'
  }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: ALGORITHM
  });
};

// Token validation
const validateAccessToken = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: [ALGORITHM], ignoreExpiration: false })
          as { sub: string; email: string; role: string };
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
};

// Refresh token system
const createRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: ALGORITHM
  });
};

// Refresh token validation
const validateRefreshToken = async (refreshToken: string) => {
  try {
    return jwt.verify(refreshToken, JWT_SECRET, {
      algorithms: [ALGORITHM],
      ignoreExpiration: false
    })
      as { userId: string };
  } catch (error) {
    console.error('Refresh token invalid:', error);
    return null;
  }
};