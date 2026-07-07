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

# Load env vars for the server
set -a
source .env
set +a

# Generate server/.env from the root .env (server reads its own .env via dotenv)
echo "→ Writing server/.env..."
cat > server/.env <<EOF
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/clientportal365
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
CLIENT_URL=https://${DOMAIN}
SERVER_PORT=3001
NODE_ENV=production
SUPABASE_URL=${SUPABASE_URL:-}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY:-}
RESEND_API_KEY=${RESEND_API_KEY:-}
EOF

# Install dependencies
echo "→ Installing dependencies..."
npm ci

# Apply database migrations
echo "→ Applying database migrations..."
(cd server && npx prisma migrate deploy)

# Build client and server
echo "→ Building client..."
npm run build --workspace=client

echo "→ Building server..."
npm run build --workspace=server

# Start/restart the server under PM2
echo "→ Restarting server..."
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

# Reload Caddy in case the Caddyfile or domain changed
echo "→ Reloading Caddy..."
cp Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy

echo ""
echo "✓ Deployment complete!"
echo "  App should be live at https://$(grep '^DOMAIN=' .env | cut -d= -f2)"
