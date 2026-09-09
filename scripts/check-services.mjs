#!/usr/bin/env node
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [rawKey, ...valueParts] = trimmed.split('=');
    const key = rawKey.trim();
    let value = valueParts.join('=').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function serviceFromUrl(name, rawUrl, defaultPort) {
  try {
    const parsed = new URL(rawUrl);
    return {
      name,
      rawUrl,
      host: parsed.hostname || '127.0.0.1',
      port: Number(parsed.port || defaultPort)
    };
  } catch {
    return null;
  }
}

function canConnect({ host, port }, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (ok, error) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve({ ok, error });
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false, new Error(`Timed out after ${timeoutMs}ms`)));
    socket.once('error', (error) => finish(false, error));
  });
}

loadDotEnv(envPath);

const services = [
  serviceFromUrl('PostgreSQL', process.env.DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:5432/king_of_barbecue', 5432),
  serviceFromUrl('Redis', process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', 6379)
].filter(Boolean);

const failures = [];
for (const service of services) {
  process.stdout.write(`Checking ${service.name} at ${service.host}:${service.port} ... `);
  const result = await canConnect(service);
  if (result.ok) {
    process.stdout.write('ok\n');
  } else {
    process.stdout.write('not reachable\n');
    failures.push({ service, error: result.error });
  }
}

if (failures.length > 0) {
  console.error('\nLocal infrastructure check failed.');
  for (const { service, error } of failures) {
    console.error(`- ${service.name} is not reachable at ${service.rawUrl}`);
    if (error?.message) console.error(`  ${error.message}`);
  }

  console.error(`
Start the required local services before running the full platform:

macOS:
  brew install postgresql@16 redis
  brew services start postgresql@16
  brew services start redis
  createdb king_of_barbecue

Ubuntu / Debian:
  sudo apt update
  sudo apt install postgresql postgresql-contrib redis-server
  sudo systemctl enable --now postgresql redis-server
  sudo -u postgres createdb king_of_barbecue

Windows:
  Install PostgreSQL from https://www.postgresql.org/download/windows/
  Run Redis through WSL2 or Memurai, then set REDIS_URL in .env if needed.

Then run:
  cp .env.example .env   # if you have not already
  npm run check:services
  npm run db:migrate
  npm run db:seed
  npm run dev

If your database or Redis is hosted elsewhere, update DATABASE_URL and REDIS_URL in .env.
`);
  process.exit(1);
}

console.log('All local services are reachable.');
