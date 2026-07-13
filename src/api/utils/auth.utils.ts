import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";

/* ----------  Constants ---------- */
export const SALT_ROUNDS = 12;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/~`]{8,}$/;

/* ----------  Password Validation ---------- */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!PASSWORD_PATTERN.test(password)) {
    return { valid: false, error: "Password must contain uppercase, lowercase, number, and special character" };
  }
  return { valid: true };
}
export const validatePassword = validatePasswordStrength;

/* ----------  Password Hashing ---------- */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ----------  JWT Configuration ---------- */
export const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-testing";
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const ALGORITHM = "HS256";
export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY = "7d";

/* ----------  Token Generation ---------- */
export function generateAccessToken(user: any) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role || "user"
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY, algorithm: ALGORITHM }
  );
}

/* ----------  Token Validation ---------- */
export function validateAccessToken(req: any) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [ALGORITHM], ignoreExpiration: false });
    return decoded as { sub: string; email: string; role: string };
  } catch (error) {
    console.error("Token validation failed:", error);
    return null;
  }
}
export const verifyAccessToken = validateAccessToken;

/* ---------- Refresh Token System ---------- */
export const createRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY, algorithm: ALGORITHM });
};
export const validateRefreshToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET, { algorithms: [ALGORITHM], ignoreExpiration: false });
    return decoded as { userId: string };
  } catch (error) {
    console.error("Refresh token invalid:", error);
    return null;
  }
};

/* ---------- Timing‑Safe String Comparison ---------- */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/* ----------  Webhook Verification ---------- */
export interface WebhookSecurityConfig {
  secret: string;
  ipWhitelist: string[];
  rateLimit: { maxRequests: number; windowMs: number };
  allowedEventTypes: string[];
}

/* HMAC‑SHA256 hash of a payload */
export function createHash(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/* Verify webhook signature using constant-time compare */
export function verifyWebhookSig(payload: string, signature: string, secret: string): boolean {
  const expected = createHash(payload, secret);
  return timingSafeEqual(signature, expected);
}

/* Rate limiting for webhook endpoints */
export function rateLimitWebhookRequests(ip: string, cfg: { maxRequests: number; windowMs: number }): boolean {
  const now = Date.now();
  const key = `rl:${ip}`;
  if (!(global as any).rateStore) {
    (global as any).rateStore = new Map();
  }
  const record = (global as any).rateStore.get(ip);
  if (!record) {
    (global as any).rateStore.set(ip, { count: 1, reset: now + cfg.windowMs });
    return true;
  }
  const rec = (global as any).rateStore.get(ip);
  if (now > rec.reset) {
    (global as any).rateStore.set(ip, { count: 1, reset: now + cfg.windowMs });
    return true;
  }
  const updated = (global as any).rateStore.get(ip);
  if (!updated) return true;
  updated.count += 1;
  (global as any).rateStore.set(ip, updated);
  return updated.count <= cfg.maxRequests;
}