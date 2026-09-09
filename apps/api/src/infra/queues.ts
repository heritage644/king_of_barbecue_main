import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '@kob/shared-types';
import { createRedisConnection } from './redis.js';

const connection = createRedisConnection('bullmq');

export const guestAccountLinkingQueue = new Queue(QUEUE_NAMES.guestAccountLinking, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000
  }
});

export const emailQueue = new Queue(QUEUE_NAMES.email, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000
  }
});

export const notificationQueue = new Queue(QUEUE_NAMES.notifications, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000
  }
});

export const analyticsQueue = new Queue(QUEUE_NAMES.analytics, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000
  }
});

export async function closeQueues() {
  await Promise.all([guestAccountLinkingQueue.close(), emailQueue.close(), notificationQueue.close(), analyticsQueue.close()]);
  await connection.quit();
}
