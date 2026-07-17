#!/bin/bash
# Deploy Todo Elephant to Production
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
echo "🚀 Deploying Todo Elephant to $ENVIRONMENT..."

# Build
echo "📦 Building application..."
npm run build

# Run tests
echo "🧪 Running test suite..."
npm run test:coverage

# Lint check
echo "🔍 Running linter..."
npm run lint

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Deploy to target environment
if [ "$ENVIRONMENT" = "production" ]; then
  echo "🏭 Deploying to PRODUCTION..."
  docker-compose -f docker-compose.production.yml up -d
  echo "✅ Production deployment complete!"
elif [ "$ENVIRONMENT" = "staging" ]; then
  echo "🧪 Deploying to STAGING..."
  docker-compose up -d
  echo "✅ Staging deployment complete!"
fi

echo "🎉 Deployment finished!"