import pg from 'pg';
import { getApiConfig } from '@kob/config';

const { Pool } = pg;
const config = getApiConfig();

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 12,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

export type DbClient = pg.PoolClient | pg.Pool;

export async function closePool() {
  await pool.end();
}
