# 🧰 Security Setup Guide for Todo Elephant

This guide outlines the steps to configure and validate our security implementation. All steps assume you have the security files created and deployed.

## 1. Pre-Deployment Preparation

### 🔗 Environment Variables Setup
Add these to your `.env` file (or platform secrets):
```
JWT_SECRET=$(openssl rand -hex 64)
WEBHOOK_SECRET=$(openssl rand -hex 32)
OAUTH_SECRET=$(openssl rand -hex 32)  # Only needed if using OAuth
```

### 🤝 Package Installation (When Restricted Lift)
```bash
# Install core security dependencies
npm install bcryptjs jsonwebtoken speakeasy

# Security testing tools
npm install --save-dev @owaspzap/nodejs security-headers jest supertest

# Optionally, add full Oauth support:
npm install next-auth google-auth-library microsoft-graph apple-sign-in
```

## 2. Deployment Steps

### 🔗 Initial Deployment
```bash
# Start dev server
npm run dev

# Verify security headers manually
curl -I http://localhost:3000
# Expected headers:
# - Strict-Transport-Security
# - Content-Security-Policy
# - X-Frame-Options

# Run security tests
npx ts-node security-test.ts
# Expected: All green checks

# Run security report
await security-report.ts
# Expected: Score >=90%

### 🔗 Production Deployment
```bash
# Deploy with HTTPS (required for HSTS)
# Set up domain in Vercel/Netlify/AWS with SSL
# Configure redirect (non-HTTPS -> HTTPS)

# Set security headers in production config (if needed)
# Update .env with production secrets
```

## 3. Initial Validation Sequence

1. Run `npx ts-node security-test.ts`
2. Fix any failures using security-report recommendations
3. Run `npx ts-node security-report.ts`
4. Once score >=90%:
   - Deploy to production
   - Set up monitoring for security events

## 4. Post-Deployment Validation

### 🔗 Security Headers Check
```bash
# For Vercel/Netlify/AWS:
# Check headers via:
curl -I https://your-production-domain.com/
```

### 🔗 User Flow Testing
```bash
# Test registration with weak password
curl -X POST http://your-domain.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"weak"}"
# Expected: 400 error

# Test with strong password
curl -X POST http://your-domain.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"strong@example.com","password":"Str0ngP@ssw0rd!"}"
# Expected: 201 Created

# Test token expiry
# First get token:
TOKEN=$(curl -s -X POST http://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"strong@example.com","password":"Str0ngP@ssw0rd!"}"
  | jq -r .token)

# Wait 15+ minutes or use tool to set time forward
# Then test token:
curl -H "Authorization: Bearer $TOKEN" http://your-domain.com/api/elephant
# Expected: 401 Unauthorized

## 5. Webhook Security Test
```bash
# Valid signature:
VALID_SIG=$(echo -n '{"test":"data"}' | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d ' ' -f2)

curl -X POST http://your-domain.com/api/integrations/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: $VALID_SIG" \
  -d '{"test":"data"}"
# Expected: 200 OK

# Invalid signature:
curl -X POST http://your-domain.com/api/integrations/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: wrongsig" \
  -d '{"test":"data"}"
# Expected: 401 Unauthorized
```