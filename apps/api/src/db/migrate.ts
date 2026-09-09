import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pool } from './pool.js';
import { logger } from '../infra/logger.js';

async function ensureMigrationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function runMigrations() {
  await ensureMigrationTable();
  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    const existing = await pool.query('SELECT version FROM schema_migrations WHERE version = $1', [version]);
    if (existing.rowCount) {
      logger.info({ migration: file }, 'Migration already applied');
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      logger.info({ migration: file }, 'Applying migration');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      await client.query('COMMIT');
      logger.info({ migration: file }, 'Migration applied');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ err: error, migration: file }, 'Migration failed');
      throw error;
    } finally {
      client.release();
    }
  }
}

runMigrations()
  .then(async () => {
    logger.info('Database migrations complete');
    await pool.end();
  })
  .catch(async (error) => {
    logger.error({ err: error }, 'Database migration process failed');
    await pool.end();
    process.exitCode = 1;
  });
