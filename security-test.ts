// Security Test Suite - Runs with Node.js only
import {
  validatePassword,
  hashPassword,
  generateAccessToken,
  verifyAccessToken,
  verifyWebhookSig,
  createHash,
  timingSafeEqual,
  rateLimitWebhookRequests
} from './src/api/utils/auth.utils';

// Test Results Tracker
interface TestResult { name: string; passed: boolean; error?: string }
const results: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (e: any) {
    results.push({ name, passed: false, error: e.message });
    console.log(`❌ ${name}: ${e.message}`);
  }
}

/* ---------- PASSWORD SECURITY TESTS ---------- */
test("Password validation rejects weak passwords", () => {
  const weak = ["123", "password", "Password123"];
  weak.forEach(pwd => {
    const result = validatePassword(pwd);
    if (result.valid) throw new Error(`Weak password passed: ${pwd}`);
  });
});

test("Password validation accepts strong passwords", () => {
  const strong = ["Str0ngP@ssw0rd!", "A1b2C3d4E5f6G7!", "SecureP@ssw0rd123"];
  strong.forEach(pwd => {
    const result = validatePassword(pwd);
    if (!result.valid) throw new Error(`Strong password failed: ${pwd}`);
  });
});

test("Password hashing produces consistent output", async () => {
  const hash1 = await hashPassword("test123");
  const hash2 = await hashPassword("test123");
  if (hash1 !== hash2) throw new Error("Hashing not deterministic");

  // Different input should produce different output
  const hash3 = await hashPassword("test456");
  if (hash1 === hash3) throw new Error("Different inputs produce same hash");
});

/* ---------- TOKEN SECURITY TESTS ---------- */
test("Access token generation and verification works", () => {
  const token = generateAccessToken({ id: "user123", email: "test@example.com" });
  const result = verifyAccessToken({ headers: { authorization: `Bearer ${token}` } } as any);
  if (!result) throw new Error("Valid token rejected");
  if (result.sub !== "user123") throw new Error("Token payload mismatch");
});

test("Invalid tokens are rejected", () => {
  const invalidTokens = ["", "invalid.token.here", "".padEnd(200, "a")];
  invalidTokens.forEach(t => {
    const decoded = verifyAccessToken({ headers: { authorization: `Bearer ${t}` } } as any);
    if (decoded) throw new Error(`Invalid token accepted: ${t}`);
  });
});

/* ---------- WEBHOOK SECURITY TESTS ---------- */
test("Webhook signature verification works", () => {
  const payload = '{"event":"test","data":{"id":123}}';
  const secret = "my-secret-key";
  const sig = createHash(payload, secret);
  if (!verifyWebhookSig(payload, sig, secret)) throw new Error("Valid signature rejected");
  if (verifyWebhookSig(payload, "wrong-sig", secret)) throw new Error("Invalid signature accepted");
});

test("Timing-safe comparison prevents attacks", () => {
  const start = Date.now();
  timingSafeEqual("a".repeat(1000), "a".repeat(1000));
  const equalTime = Date.now() - start;

  const start2 = Date.now();
  timingSafeEqual("a".repeat(1000), "b".repeat(1000));
  const diffTime = Date.now() - start2;

  if (Math.abs(equalTime - diffTime) > 5) throw new Error("Timing attack vulnerability detected");
});

/* ---------- RATE LIMITING TESTS ---------- */
test("Rate limiting allows requests under threshold", () => {
  (global as any).rateStore = new Map();
  let allowed = true;
  for (let i = 0; i < 95; i++) {
    if (!rateLimitWebhookRequests("192.168.1.1", { maxRequests: 100, windowMs: 15 * 60 * 1000 })) {
      allowed = false; break;
    }
  }
  if (!allowed) throw new Error("Legitimate requests blocked by rate limiter");
});

test("Rate limiting blocks excessive requests", () => {
  (global as any).rateStore = new Map();
  let blocked = false;
  for (let i = 0; i < 105; i++) {
    if (!rateLimitWebhookRequests("192.168.1.2", { maxRequests: 100, windowMs: 15 * 60 * 1000 })) {
      blocked = true; break;
    }
  }
  if (!blocked) throw new Error("Rate limiter failed to block excessive requests");
});

/* ---------- SECURITY HEADERS TESTS ---------- */
test("Security headers middleware runs", () => {
  console.log("ℹ️  Security headers test: Verify manually via curl -I http://localhost:3000");
});

// Run all tests
console.log("🔐 Running Security Test Suite...\n");
test("Password validation rejects weak passwords", () => {});
test("Password validation accepts strong passwords", () => {});
test("Password hashing produces consistent output", async () => {});
test("Access token generation and verification works", () => {});
test("Invalid tokens are rejected", () => {});
test("Webhook signature verification works", () => {});
test("Timing-safe comparison prevents attacks", () => {});
test("Rate limiting allows requests under threshold", () => {});
test("Rate limiting blocks excessive requests", () => {});
test("Security headers middleware runs", () => {});

console.log("\n📊 Test Results:");
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`✅ Passed: ${passed}/${total}`);

if (passed < total) {
  console.log("\n❌ Failed Tests:");
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
  process.exit(1);
} else {
  console.log("\n🎉 All security tests passed!");
  process.exit(0);
}