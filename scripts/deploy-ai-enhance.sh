#!/bin/bash
# todo-ai-enhance-deploy.sh
# Production deployment script for Todo Elephant AI Enhancement

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-staging}"
VERSION="${2:-$(git rev-parse --short HEAD)}"

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"; }
info() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }

usage() {
  cat << EOF
Usage: $0 <environment> [version]
  environment: staging | production
  version: Git tag or commit SHA (default: current commit)

Examples:
  $0 staging
  $0 production v0.2.0-ai-enhance
  $0 production abc1234
EOF
  exit 1
}

validate_env() {
  if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Invalid environment: $ENVIRONMENT"
    usage
  fi
}

check_prerequisites() {
  log "Checking prerequisites..."

  # Check git repo
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
    exit 1
  fi

  # Check uncommitted changes
  if ! git diff-index --quiet HEAD --; then
    warn "Uncommitted changes detected"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi

  # Check required tools
  for cmd in kubectl docker npm git; do
    if ! command -v $cmd &> /dev/null; then
      error "$cmd is not installed"
      exit 1
    fi
  done

  # Check environment variables
  local required_vars=("OPENAI_API_KEY" "KUBECONFIG")
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      error "Required environment variable $var not set"
      exit 1
    fi
  done

  log "Prerequisites check passed"
}

build_and_test() {
  log "Building and testing..."

  info "Installing dependencies..."
  npm ci

  info "Running TypeScript compilation..."
  npm run build

  info "Running linter..."
  npm run lint

  info "Running tests..."
  npm run test

  info "Running test coverage..."
  npm run test:coverage

  log "Build and test completed successfully"
}

build_image() {
  local tag="todo-elephant:ai-enhance-${VERSION}"
  local full_tag="${REGISTRY}/${tag}"

  log "Building Docker image: $full_tag"
  docker build -t "$tag" .
  docker tag "$tag" "$full_tag"

  log "Pushing to registry..."
  docker push "$full_tag"

  IMAGE_TAG="$full_tag"
}

deploy_k8s() {
  log "Deploying to $ENVIRONMENT..."

  # Apply database migrations
  info "Applying database migrations..."
  kubectl apply -f db/migrations/ -n "$ENVIRONMENT"

  # Update deployment image
  info "Updating deployment image..."
  kubectl set image deployment/todo-elephant \
    todo-elephant="$IMAGE_TAG" \
    -n "$ENVIRONMENT"

  # Wait for rollout
  info "Waiting for rollout to complete..."
  kubectl rollout status deployment/todo-elephant \
    -n "$ENVIRONMENT" --timeout=300s

  # Verify deployment
  info "Verifying deployment..."
  kubectl wait --for=condition=available \
    deployment/todo-elephant \
    -n "$ENVIRONMENT" --timeout=60s

  log "Deployment completed"
}

run_smoke_tests() {
  log "Running smoke tests..."

  local base_url
  if [[ "$ENVIRONMENT" == "production" ]]; then
    base_url="https://todo-elephant.prod.example.com"
  else
    base_url="https://staging.todo-elephant.dev"
  fi

  local token="${API_TOKEN:-$STAGING_TOKEN}"
  if [[ -z "$token" ]]; then
    warn "No API token provided, skipping authenticated tests"
    return
  fi

  local endpoints=(
    "/api/health"
    "/api/ai-suggest?context=morning"
    "/api/ai-prioritize"
    "/api/ai-forecast"
    "/api/templates"
    "/api/adaptive-learning/recommendations"
    "/api/skills/user"
    "/api/achievements/user"
    "/api/stats/user"
  )

  for endpoint in "${endpoints[@]}"; do
    info "Testing $endpoint..."
    if [[ "$endpoint" == "/api/health" ]]; then
      curl -f -s -o /dev/null -w "%{http_code}" "$base_url$endpoint" > /dev/null
    else
      curl -f -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $token" \
        "$base_url$endpoint" > /dev/null
    fi
    echo " ✓"
  done

  log "Smoke tests passed"
}

enable_feature_flags() {
  local percentage="${1:-5}"

  log "Enabling AI feature flags at ${percentage}%..."
  kubectl set config feature-flags.ai-enabled=true \
    feature-flags.ai-beta-percentage="${percentage}" \
    -n "$ENVIRONMENT"

  log "Feature flags enabled"
}

main() {
  validate_env
  check_prerequisites

  log "Starting AI Enhancement deployment to $ENVIRONMENT (version: $VERSION)"

  build_and_test
  build_image
  deploy_k8s
  run_smoke_tests
  enable_feature_flags

  log "✅ Deployment to $ENVIRONMENT completed successfully!"
  log "Image: $IMAGE_TAG"
  log "Next steps: Monitor dashboard and review logs for 30 minutes"
}

# Configuration
REGISTRY="${REGISTRY:-registry.example.com}"

if [[ $# -eq 0 ]]; then
  usage
fi

main "$@"