#!/usr/bin/env bash
set -euo pipefail

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This setup script is intended for Ubuntu/Debian-based GitHub Codespaces." >&2
  exit 1
fi

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required in Codespaces to install/start PostgreSQL and Redis." >&2
  exit 1
fi

echo "Installing PostgreSQL and Redis for GitHub Codespaces..."
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib redis-server

bash scripts/start-local-infra.sh

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
else
  echo ".env already exists; leaving it unchanged."
fi

echo "Installing Node dependencies..."
npm install

echo "Checking services..."
npm run check:services

echo "Running migrations..."
npm run db:migrate

echo "Seeding sample data..."
npm run db:seed

cat <<'DONE'

Codespaces setup complete.

Start the app with:
  npm run dev

Then open forwarded port 3000 from the Codespaces Ports tab.
The API listens on port 4000 internally and is proxied through the Next.js app at /api/backend.

Seeded staff login:
  admin@kingbbq.local / password123
DONE
