# Quick Start: Security Implementation

This guide will help you quickly set up all security features in your application.

## 1. Install Dependencies (Already Installed ✅)

All necessary security packages are already in your `package.json`:

- `@upstash/ratelimit` - Rate limiting
- `@upstash/redis` - Redis backend for rate limiting
- `isomorphic-dompurify` - HTML sanitization
- `zod` - Input validation
- `bcryptjs` - Password hashing
- `@edge-csrf/nextjs` - CSRF protection

## 2. Environment Setup

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Generate a secure NextAuth secret:

```bash
openssl rand -base64 32
```

3. Set up Upstash Redis (Required for rate limiting):
   - Go to https://upstash.com/
   - Create a free account
   - Create a new Redis database
   - Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   - Add them to `.env.local`

4. Update `.env.local` with your values:

```env
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
DATABASE_URL="your-database-url"
```

## 3. Verify Security is Working

### Test Rate Limiting

Try making multiple requests quickly:

```bash
# Should get 429 Too Many Requests after limits
for i in {1..20}; do curl http://localhost:3000/; done
```

### Test Security Headers

Check headers are applied:

```bash
curl -I http://localhost:3000/
```

Look for:

- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Content-Security-Policy`
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`

### Test Input Validation

Try creating an account with invalid data - should get validation errors.

## 4. Security Features Overview

### ✅ What's Protected

1. **DDoS Protection**: Rate limiting on all routes and API endpoints
2. **XSS Prevention**: Content Security Policy + Input sanitization
3. **SQL Injection**: Prisma ORM with parameterized queries
4. **CSRF**: NextAuth tokens + Origin verification
5. **Clickjacking**: X-Frame-Options header
6. **MIME Sniffing**: X-Content-Type-Options
7. **Password Security**: Strong requirements + bcrypt hashing
8. **Brute Force**: Rate limiting on authentication

### 📁 Key Files

- `next.config.ts` - Security headers
- `middleware.ts` - Rate limiting + route protection
- `src/lib/security.ts` - Input validation & sanitization
- `src/lib/rate-limit.ts` - Rate limiting configuration
- `src/lib/api-security.ts` - API security utilities
- `src/lib/password-security.ts` - Password utilities
- `src/lib/env-validation.ts` - Environment validation

## 5. Using Security in Your Code

### Protect an API Route

```typescript
import { authRateLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { signupValidation } from "@/lib/security";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Rate limiting
  const identifier = getClientIdentifier(req);
  const { success } = await authRateLimiter.limit(identifier);

  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // 2. Validate input
  const body = await req.json();
  const validation = signupValidation.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.errors },
      { status: 400 }
    );
  }

  // 3. Use validated data
  const { email, username, password } = validation.data;

  // Process safely...
}
```

### Validate User Input

```typescript
import { emailSchema, usernameSchema } from "@/lib/security";

// Validate single field
const emailValidation = emailSchema.safeParse(email);
if (!emailValidation.success) {
  console.error(emailValidation.error);
}

// Validate object
const validation = signupValidation.safeParse(formData);
if (validation.success) {
  // Use validation.data (sanitized)
}
```

### Check Password Strength

```typescript
import { checkPasswordStrength } from "@/lib/password-security";

const { score, feedback, isStrong } = checkPasswordStrength(password);
console.log(`Strength: ${score}/4`);
console.log(`Feedback:`, feedback);
```

## 6. Rate Limit Configuration

Adjust in `src/lib/rate-limit.ts`:

```typescript
// Current limits:
- API Routes: 10 requests / 10 seconds
- Auth Routes: 5 requests / 60 seconds
- Sensitive: 3 requests / 300 seconds
- Pages: 100 requests / 60 seconds
```

Increase for production as needed based on traffic patterns.

## 7. Content Security Policy

Current CSP in `next.config.ts` allows:

- Scripts: self, unsafe-eval, unsafe-inline (for React), vercel.live
- Styles: self, unsafe-inline (for styled-components)
- Images: self, data:, https:
- Connections: self, https:, wss: (for WebSocket)

**Adjust for your domain**: Update the CSP if you load resources from specific domains.

## 8. Pre-Production Checklist

Before deploying:

- [ ] Set strong NEXTAUTH_SECRET (32+ chars)
- [ ] Configure production Upstash Redis
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Enable HTTPS
- [ ] Run `npm audit` and fix issues
- [ ] Test all auth flows
- [ ] Test rate limiting
- [ ] Review CSP for your domain
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure WAF (Cloudflare, etc.)

## 9. Testing

```bash
# Check for vulnerabilities
npm audit

# Fix auto-fixable issues
npm audit fix

# Run linter
npm run lint

# Build to check for errors
npm run build
```

## 10. Monitoring

In production, monitor:

- Rate limit hits (429 responses)
- Failed authentication attempts
- Security events in logs
- Database query performance
- API response times

## 11. Need Help?

- See `SECURITY.md` for detailed documentation
- See `SECURITY-CHECKLIST.md` for deployment checklist
- Check environment with `npm run dev` - will show validation errors

## 12. Advanced Features

### Add 2FA (Optional)

Consider adding `@next-auth/twilio-adapter` or similar for two-factor authentication.

### Add CAPTCHA (Optional)

Use `react-google-recaptcha` for bot prevention on signup/login.

### Enhanced Logging (Optional)

Integrate with Sentry, Datadog, or similar for security event tracking.

## 🎉 You're Protected!

Your application now has enterprise-grade security protecting against the most common vulnerabilities. Follow the deployment checklist before going live.
