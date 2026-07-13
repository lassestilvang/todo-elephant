# Todo Elephant Deployment Checklist

## Pre-Deployment Verification
- [ ] Environment variables configured (.env.production)
- [ ] MongoDB cluster accessible and credentials valid
- [ ] JWT_SECRET is strong (minimum 32 characters)
- [ ] Marketplace API keys configured (Etsy, Amazon)
- [ ] Rate limiting thresholds appropriate for expected traffic
- [ ] Security headers properly configured (CSP, X-Frame-Options, etc.)

## Database Verification
- [ ] ElephantProperty collection created with proper indexes
- [ ] User collection created with email unique index
- [ ] Test database connection
- [ ] Verify schema migrations if applicable

## API Endpoint Testing
- [ ] Authentication endpoints (/api/auth/*)
- [ ] Calendar endpoints (/api/elephant/calendar)
- [ ] Marketplace endpoints (/api/elephant/marketplace/*)
- [ ] Recommendation endpoints (/api/elephant/recommendations/*)
- [ ] Health check endpoint (/api/health)
- [ ] All endpoints require authentication where appropriate

## Security Verification
- [ ] JWT tokens expire correctly (access: 24h, refresh: 7d)
- [ ] Invalid tokens return 401
- [ ] Rate limiting blocks excessive requests (429)
- [ ] Security headers present in responses
- [ ] CORS configured appropriately (if needed)
- [ ] Input validation prevents injection attacks

## Performance Verification
- [ ] API response times under 200ms for cached data
- [ ] Database queries use indexes
- [ ] Virtual staging loads 3D models efficiently
- [ ] Marketplace scanning respects external API rate limits
- [ ] Memory usage stable under load

## Monitoring & Logging
- [ ] Winston logger configured (console + file)
- [ ] Error logs written to logs/error.log
- [ ] Access logs written to logs/access.log
- [ ] Performance metrics being collected
- [ ] Alert thresholds configured (if using external monitoring)

## Frontend Verification
- [ ] All pages load correctly (/dashboard, /calendar, etc.)
- [ ] VirtualStagingStudio renders without errors
- [ ] ContentCalendar component syncs with backend
- [ ] MarketplaceScanner displays results correctly
- [ ] Authentication flow works (login → protected routes)
- [ ] Responsive design works on mobile/tablet/desktop

## Post-Deployment Steps
- [ ] Verify health endpoint returns 200
- [ ] Test authentication flow end-to-end
- [ ] Create initial admin user
- [ ] Run initial marketplace sync
- [ ] Check logs for errors
- [ ] Set up automated backups (if applicable)
- [ ] Configure monitoring alerts (if using external service)

## Rollback Procedure
- [ ] Vercel: Use dashboard rollback feature
- [ ] Docker: docker-compose pull && docker-compose up -d
- [ ] Kubernetes: kubectl rollout undo deployment/todo-elephant

## Emergency Contacts
- [ ] Database admin: [Contact Info]
- [ ] DevOps engineer: [Contact Info]
- [ ] Security contact: [Contact Info]

## Verification Commands
```bash
# Check health
curl -v https://your-domain.com/api/health

# Test auth
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test calendar
curl -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/elephant/calendar

# Test marketplace scan (requires keys)
curl -H "Authorization: Bearer <token>" \
  -X POST https://your-domain.com/api/elephant/marketplace/scan \
  -d '{"query":"elephant statue","platform":"etsy"}'
```