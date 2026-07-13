# Elephant Elephant Deployment Guide

## Local Development
1. Clone repository: `git clone https://github.com/lassestilvang/todo-elephant.git`
2. Install dependencies: `npm install`
3. Set environment variables: `cp .env.example .env`
4. Start server: `npm run dev`

## Production Deployment
1. **Vercel**
   - Login: `vercel login`
   - Deploy: `vercel --prod`
   - Environment variables: Set in Vercel dashboard

2. **Docker**
   ```bash
   docker build -t todo-elephant .
   docker run -p 3000:3000 \
     -e MONGODB_URI=$MONGODB_URI \
     -e JWT_SECRET=$JWT_SECRET \
     -e ETSY_API_KEY=$ETSY_API_KEY \
     -e AMAZON_API_KEY=$AMAZON_API_KEY \
     todo-elephant
   ```

3. **Serverless Framework**
   ```bash
   sls deploy --stage production --region us-east-1
   ```

## Post-Deployment
1. Verify environment variables
2. Check MongoDB connection
3. Run initial sync: `npm run sync`
4. Monitor logs: `tail -f logs/ephant-log.log`

## Maintenance
- Run weekly sync: `npm run sync-weekly`
- Audit dependencies: `npm audit fix`
- Generate backups: `npm run backup`