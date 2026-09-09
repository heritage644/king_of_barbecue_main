import { Redis } from 'ioredis';
import { getApiConfig } from '@kob/config';
import { logger } from './logger.js';

const config = getApiConfig();

export function createRedisConnection(name: string) {
  const client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectionName: `kob-api-${name}`
  });

  client.on('error', (error) => {
    logger.error({ err: error, redisConnection: name }, 'Redis connection error');
  });

  return client;
}

export const redis = createRedisConnection('primary');
