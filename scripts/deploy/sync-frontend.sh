#!/usr/bin/env bash
set -euo pipefail

# Build and rsync the React frontend build/ to a remote server.
# Usage:
#   scripts/deploy/sync-frontend.sh user@host:/var/www/app.readandlead.app

DEST=${1:-}
if [ -z "$DEST" ]; then
  echo "Usage: $0 user@host:/var/www/app.readandlead.app"
  exit 1
fi

HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)

cd "$ROOT/react-frontend"
echo "[1/2] Building React app (production)..."
npm ci
npm run build

echo "[2/2] Syncing build/ to $DEST ..."
rsync -avz --delete build/ "$DEST"/
echo "Done."

