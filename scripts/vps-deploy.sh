#!/bin/bash
# Deploy / re-deploy on the Hostinger VPS
# Run from /app: bash scripts/vps-deploy.sh

set -e

APP_DIR="/app"
cd "$APP_DIR"

echo "=== Deploying ClientPortal365 ==="

# Pull latest code
echo "→ Pulling latest code..."
git pull origin main

# Build and restart containers
echo "→ Building and starting containers..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# Remove dangling images to free disk space
echo "→ Cleaning up old images..."
docker image prune -f

echo ""
echo "✓ Deployment complete!"
echo "  App should be live at https://$(grep '^DOMAIN=' .env | cut -d= -f2)"
