import os
import os.environmentscripts_package.json
Install dependencies: `npm install`
5. Build for production: `npm run build && npm start`

### Environment Variables
```env
# Next.js
NEXT_PUBLIC_APP_NAME=TodoElephant
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/todo-elephant?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_strong_jwt_secret_here
ACCESS_TOKEN_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Marketplace APIs
ETSY_API_KEY=your_etsy_api_key
ETSY_APP_KEY=your_etsy_app_key
AMAZON_API_KEY=your_amazon_api_key
AMAZON_ACCESS_TOKEN=your_amazon_access_token

# Security
NODE_ENV=development
DISABLE_TELEMETRY=true

# Monitoring
LOG_LEVEL=info
ENABLE_RATE_LIMITING=true

# Optional: External monitoring services
SENTRY_DSN=your_sentry_dsn_here
LOGGLY_TOKEN=your_loggly_token_here
```

## Deployment
1. **Vercel**
   - Install: `npm i -g vercel`
   - Login: `vercel login`
   - Deploy: `vercel --prod --confirm`
   - Environment variables: Set in Vercel project settings

2. **Docker Compose**
   ```bash
   docker-compose up -d --build
   ```

3. **Kubernetes**
   ```bash
   kubectl apply -f k8s k8s Files:
  - `k8s/deployment.yaml`
  - `k8s/service.yaml`
  - `k8s/secret.yaml`
  - `k8s/configmap.yaml`

## Post-Deployment Checks
1. Verify health endpoint: `curl https://your-domain.com/api/health`
2. Check API status: `curl https://your-domain.com/api/elephant/calendar`
3. View logs: `kubectl logs -f deployment/todo-elephant -c app` (K8s) or `docker logs -f todo-elephant` (Docker)
4. Run database migrations: `npm run prisma:migrate` (if using Prisma) or `node ./scripts/migrate.js`
5. Clear cache: `redis-cli flushall` (if using Redis)

## Maintenance Scripts
- `npm run backup` - Database backup
- `npm run audit` - Security dependency audit
- `npm run test:full` - Full test suite with coverage
- `npm run lint:fix` - Auto-fix linting errors
- `npm run stats` - Generate usage statistics

## Troubleshooting
### Common Issues
1. **Database Connection Failed**
   - Check MONGODB_URI format
   - Verify network access to MongoDB cluster
   - Ensure username/password are correct

2. **Authentication Failures**
   - Confirm JWT_SECRET is set and matches across services
   - Check token expiration times
   - Verify user exists in database

3. **Marketplace API Errors**
   - Validate ETSY_API_KEY and AMAZON_API_KEY
   - Check rate limits on external APIs
   - Ensure IP whitelisting is configured (if applicable)

4. **Performance Degradation**
   - Monitor response times via `/api/health` endpoint
   - Check database query performance
   - Review cache hit ratios
   - Consider scaling resources

### Log Analysis
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`
- Performance metrics: `logs/performance.log`
- Security events: `logs/security.log`

## Rollback Procedure
1. **Vercel**: Use "Rollback" in dashboard deployments tab
2. **Docker**: `docker-compose pull && docker-compose up -d`
3. **Kubernetes**: `kubectl rollout undo deployment/todo-elephant`

## Support
For issues, please check:
- GitHub Issues: https://github.com/lassestilvang/todo-elephant/issues
- Documentation: https://github.com/lassestilvang/todo-elephant/blob/main/docs/
- Community: https://discord.gg/todoelephant