#!/usr/bin/env bash
set -euo pipefail

# This script prepares a Ubuntu-like server to run the API behind Nginx with HTTPS.
# Run as root on the server after copying the repo to /opt/readandlead.

ROOT_DIR="/opt/readandlead"
APP_DIR="$ROOT_DIR/server"
VENV_DIR="$ROOT_DIR/venv"
SERVICE_NAME="readandlead-api"
API_DOMAIN="api.readandlead.app"
APP_DOMAIN="app.readandlead.app"

echo "[1/6] Installing system packages (python, nginx, certbot)..."
apt-get update -y
apt-get install -y python3-venv python3-pip nginx certbot python3-certbot-nginx

echo "[2/6] Creating directories..."
mkdir -p "$ROOT_DIR" "$APP_DIR" /var/www/$APP_DOMAIN

if [ ! -d "$VENV_DIR" ]; then
  echo "[3/6] Creating Python venv..."
  python3 -m venv "$VENV_DIR"
fi

echo "[4/6] Installing backend dependencies..."
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r "$APP_DIR/requirements.txt" gunicorn

echo "[5/6] Installing systemd service..."
install -m 0644 "$ROOT_DIR/scripts/systemd/$SERVICE_NAME.service" \
  /etc/systemd/system/$SERVICE_NAME.service
systemctl daemon-reload
systemctl enable --now $SERVICE_NAME
systemctl status --no-pager $SERVICE_NAME || true

echo "[6/6] Installing Nginx configs..."
install -m 0644 "$ROOT_DIR/scripts/nginx/$API_DOMAIN.conf" /etc/nginx/sites-available/$API_DOMAIN.conf
install -m 0644 "$ROOT_DIR/scripts/nginx/$APP_DOMAIN.conf" /etc/nginx/sites-available/$APP_DOMAIN.conf
ln -sf /etc/nginx/sites-available/$API_DOMAIN.conf /etc/nginx/sites-enabled/$API_DOMAIN.conf
ln -sf /etc/nginx/sites-available/$APP_DOMAIN.conf /etc/nginx/sites-enabled/$APP_DOMAIN.conf
nginx -t && systemctl reload nginx

echo "Requesting Let's Encrypt certificates via certbot (you must have DNS pointing to this server)."
echo "Run: certbot --nginx -d $API_DOMAIN -d $APP_DOMAIN"
echo "Then: systemctl reload nginx"

echo "Done. Upload your React build to /var/www/$APP_DOMAIN and verify https://$APP_DOMAIN and https://$API_DOMAIN"

