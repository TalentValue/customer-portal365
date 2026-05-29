#!/bin/bash
# One-time setup for a fresh Hostinger VPS (Ubuntu 22.04)
# Run as root: bash vps-setup.sh

set -e

echo "=== ClientPortal365 VPS Setup ==="

# 1. System update
apt-get update -qq && apt-get upgrade -y -qq

# 2. Install Docker
echo "→ Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# 3. Install Docker Compose v2
echo "→ Installing Docker Compose..."
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 4. Firewall — allow SSH, HTTP, HTTPS
echo "→ Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 5. Clone repo
echo "→ Cloning repository..."
git clone https://github.com/delphiwebtechgit/replit.git /app
cd /app

# 6. Create .env from example
cp .env.example .env
echo ""
echo "======================================================"
echo "  Setup complete!"
echo "  Next steps:"
echo "  1. Edit /app/.env — set DOMAIN, POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET"
echo "  2. Point your domain's A record to this VPS IP"
echo "  3. Run: cd /app && bash scripts/vps-deploy.sh"
echo "======================================================"
