#!/bin/bash
# deploy.sh - Todo Elephant AI Enhancement Deployment Script

set -euo pipefail

echo "🚀 Starting Todo Elephant AI Enhancement Deployment"
echo "=================================================="

# Configuration
ENVIRONMENT=${1:-staging}
REGISTRY=${REGISTRY:-your-registry.com/todo-elephant}
TAG=${TAG:-$(git rev-parse --short HEAD)}
IMAGE="${REGISTRY}:${TAG}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
  echo -e "${GREEN}[${ENVIRONMENT}]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[${ENVIRONMENT}]${NC} $1"
}

error() {
  echo -e "${RED}[${ENVIRONMENT}]${NC} $1"
}

# Step 1: Pre-flight checks
log "Running pre-flight checks..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  error "Not in a git repository"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  warn "You have uncommitted changes. Proceeding anyway..."
fi

# Check environment variables
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  error "OPENAI_API_KEY environment variable is required"
  exit 1
fi

# Step 2: Install dependencies
log "Installing dependencies..."
npm ci

# Step 3: Run type checking
log "Running TypeScript compilation..."
npm run build

# Step 4: Run lint check
```

Let me actually create a few concrete deliverables that would be genuinely useful for the next operational
<tool_call>
<function=Write>
<parameter=content>
#!/bin/bash
# deploy.sh - Todo Elephant AI Enhancement Deployment Script

set -euo pipefail

echo "🚀 Starting Todo Elephant AI Enhancement Deployment"
echo "=================================================="

# Configuration
ENVIRONMENT=${1:-staging}
REGISTRY=${REGISTRY:-your-registry.com/todo-elephant}
TAG=${TAG:-$(git rev-parse --short HEAD)}
IMAGE="${REGISTRY}:${TAG}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
  echo -e "${GREEN}[${ENVIRONMENT}]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[${ENVIRONMENT}]${NC} $1"
}

error() {
  echo -e "${RED}[${ENVIRONMENT}]${NC} $1"
}

# Step 1: Pre-flight checks
log "Running pre-flight checks..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  error "Not in a git repository"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  warn "You have uncommitted changes. Proceeding anyway..."
fi

# Check environment variables
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  error "OPENAI_API_KEY environment variable is required"
  exit 1
fi

# Step 2: Install dependencies
log "Installing dependencies..."
npm ci

# Step 3: Run type checking
log "Running TypeScript compilation..."
npm run build

# Step 4: Run tests
log "Running test suite..."
npm run test

# Step 5: Build Docker image
log "Building Docker image: $IMAGE"
docker build -t "$IMAGE" .

# Step 6: Push to registry
log "Pushing image to registry..."
docker push "$IMAGE"

# Step 7: Deploy to Kubernetes (example)
if [[ "$ENVIRONMENT" == "production" ]]; then
  log "Deploying to production Kubernetes cluster..."
  kubectl set image deployment/todo-elephant todo-elephant="$IMAGE" --namespace=production
else
  log "Deploying to staging Kubernetes cluster..."
  kubectl set image deployment/todo-elephant-staging todo-elephant="$IMAGE" --namespace=staging
fi

# Step 8: Verify deployment
log "Verifying deployment..."
kubectl rollout status deployment/todo-elephant-"$ENVIRONMENT" --timeout=120s

# Step 9: Run smoke tests
log "Running smoke tests..."
./scripts/smoke-test.sh "$ENVIRONMENT"

log "✅ Deployment complete! Image: $IMAGE"
echo "📊 Monitor with: kubectl logs -f deployment/todo-elephant-$ENVIRONMENT"