import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTokens, verifyToken, validatePassword } from '@/lib/auth';

// Mock JWT
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn(() => 'mock-token'),
  verify: vi.fn(() => ({ userId: '1', email: 'test@test.com', role: 'user', type: 'access' }))
}));

describe('Auth Utilities', () => {
  describe('validatePassword', () => {
    it('rejects password shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('rejects password without uppercase letter', () => {
      const result = validatePassword('password123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('rejects password without lowercase letter', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('rejects password without number', () => {
      const result = validatePassword('Password!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('rejects password without special character', () => {
      const result = validatePassword('Password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('accepts valid password', () => {
      const result = validatePassword('Password123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generateTokens', () => {
    it('generates access and refresh tokens', () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        role: 'user' as const
      };

      const tokens = generateTokens(mockUser as any);
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
    });
  });

  describe('verifyToken', () => {
    it('verifies valid token', () => {
      const payload = verifyToken('valid-token');
      expect(payload).not.toBeNull();
      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('email');
    });

    it('returns null for invalid token', () => {
      vi.mocked(require('jsonwebtoken').verify).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const payload = verifyToken('invalid-token');
      expect(payload).toBeNull();
    });
  });
});