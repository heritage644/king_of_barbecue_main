#!/usr/bin/env bash
set -euo pipefail

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required to start local PostgreSQL/Redis services on Linux/Codespaces." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "PostgreSQL is not installed. In Codespaces run: npm run setup:codespaces" >&2
  exit 1
fi

if ! command -v redis-server >/dev/null 2>&1; then
  echo "Redis is not installed. In Codespaces run: npm run setup:codespaces" >&2
  exit 1
fi

echo "Starting PostgreSQL..."
sudo service postgresql start >/dev/null

echo "Starting Redis..."
sudo service redis-server start >/dev/null

echo "Ensuring local PostgreSQL password/database match .env.example..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" >/dev/null
sudo -u postgres createdb king_of_barbecue 2>/dev/null || true

echo "Local PostgreSQL and Redis are running."
echo "Run: npm run check:services"
