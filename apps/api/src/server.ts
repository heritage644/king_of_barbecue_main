import { getApiConfig } from '@kob/config';
import { createApp } from './app.js';
import { logger } from './infra/logger.js';
import { startRealtimeBridge } from './realtime/eventBus.js';
import { pool } from './db/pool.js';
import { redis } from './infra/redis.js';
import { closeQueues } from './infra/queues.js';

const config = getApiConfig();
const app = createApp();

await startRealtimeBridge();

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info({ port: config.port }, 'King of Barbecue API listening');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down API');
  server.close(async () => {
    await Promise.allSettled([closeQueues(), pool.end(), redis.quit()]);
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
