#!/usr/bin/env bash
set -euo pipefail

# Usage: ./run_gunicorn.sh [bind_addr]
# Example: ./run_gunicorn.sh 127.0.0.1:8000

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

if [ -f .env ]; then
  echo "Loading .env"
  set -a; source .env; set +a
elif [ -f .env.server ]; then
  echo "Loading .env.server"
  set -a; source .env.server; set +a
fi

BIND=${1:-127.0.0.1:8000}

exec gunicorn \
  -w 2 \
  -k uvicorn.workers.UvicornWorker \
  app.main:app \
  -b "$BIND"
