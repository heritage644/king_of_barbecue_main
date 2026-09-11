import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import pg from 'pg';
import pino from 'pino';
import http from 'http';
import { getWorkerConfig } from '@kob/config';
import { QUEUE_NAMES } from '@kob/shared-types';

const config = getWorkerConfig();
const logger = pino({ level: config.logLevel });
const { Pool } = pg;
const pool = new Pool({ connectionString: config.databaseUrl, max: 5 });

// --- Minimal HTTP server just to satisfy Render's port scan ---
const port = process.env.PORT || 3001;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
server.listen(port, () => {
  logger.info({ port }, 'Health check server listening');
});
// ----------------------------------------------------------------

function createConnection(name: string) {
  const connection = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectionName: `kob-worker-${name}`
  });
  connection.on('error', (error: Error) => logger.error({ err: error, name }, 'Redis worker connection error'));
  return connection;
}

const connection = createConnection('bullmq');

const workers = [
  new Worker(
    QUEUE_NAMES.guestAccountLinking,
    async (job) => {
      const { userId, email, phone, sourceOrderId } = job.data as {
        userId: string;
        email: string;
        phone?: string;
        sourceOrderId?: string;
      };

      const result = await pool.query(
        `UPDATE orders
         SET user_id = $1
         WHERE user_id IS NULL
           AND lower(guest_email) = lower($2)
           AND ($3::text IS NULL OR guest_phone = $3)
         RETURNING id, public_code`,
        [userId, email, phone ?? null]
      );

      logger.info({ userId, email, sourceOrderId, linkedCount: result.rowCount }, 'Linked historical guest orders');
      return { linkedCount: result.rowCount };
    },
    { connection, concurrency: 4 }
  ),
  new Worker(
    QUEUE_NAMES.email,
    async (job) => {
      logger.info({ job: job.name, data: job.data }, 'Email job placeholder processed');
      return { delivered: false, reason: 'No email provider configured in Phase 1' };
    },
    { connection, concurrency: 5 }
  ),
  new Worker(
    QUEUE_NAMES.notifications,
    async (job) => {
      logger.info({ job: job.name, data: job.data }, 'Notification job placeholder processed');
      return { delivered: true };
    },
    { connection, concurrency: 5 }
  ),
  new Worker(
    QUEUE_NAMES.analytics,
    async (job) => {
      logger.info({ job: job.name, data: job.data }, 'Analytics aggregation placeholder processed');
      return { aggregated: false, reason: 'Historical analytics module is scheduled for a later phase' };
    },
    { connection, concurrency: 2 }
  )
];

for (const worker of workers) {
  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, queueName: worker.name, err: error }, 'Worker job failed');
  });
  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id, queueName: worker.name }, 'Worker job completed');
  });
}

logger.info('King of Barbecue workers are running');

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down workers');
  await Promise.all(workers.map((worker) => worker.close()));
  await Promise.allSettled([connection.quit(), pool.end()]);
  server.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));