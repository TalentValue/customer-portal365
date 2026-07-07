#!/bin/bash
# One-time setup for a fresh Hostinger VPS (Ubuntu 22.04)
# Run as root: bash vps-setup.sh

set -e

echo "=== ClientPortal365 VPS Setup ==="

# 1. System update
apt-get update -qq && apt-get upgrade -y -qq

# 2. Install Node.js 20
echo "→ Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. Install PM2
echo "→ Installing PM2..."
npm install -g pm2

# 4. Install PostgreSQL
echo "→ Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# 5. Install Caddy
echo "→ Installing Caddy..."
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update -qq
apt-get install -y caddy

# 6. Firewall — allow SSH, HTTP, HTTPS
echo "→ Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 7. Clone repo
echo "→ Cloning repository..."
git clone https://github.com/delphiwebtechgit/replit.git /app
cd /app

# 8. Create .env from example
cp .env.example .env

# 9. Create database
echo "→ Creating database..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'change_me_strong_password';"
sudo -u postgres createdb clientportal365 || true

# 10. Install Caddyfile
cp Caddyfile /etc/caddy/Caddyfile
systemctl enable caddy
systemctl restart caddy

echo ""
echo "======================================================"
echo "  Setup complete!"
echo "  Next steps:"
echo "  1. Edit /app/.env — set DOMAIN, POSTGRES_PASSWORD (must match step 9), JWT_SECRET, JWT_REFRESH_SECRET"
echo "  2. Point your domain's A record to this VPS IP"
echo "  3. Run: cd /app && bash scripts/vps-deploy.sh"
echo "======================================================"
