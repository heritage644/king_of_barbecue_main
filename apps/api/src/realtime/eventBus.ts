import { EventEmitter } from 'node:events';
import { nanoid } from 'nanoid';
import type { RealtimeEvent, RealtimeEventType } from '@kob/shared-types';
import { createRedisConnection, redis } from '../infra/redis.js';
import { logger } from '../infra/logger.js';

const CHANNEL = 'kob:realtime-events';
const emitter = new EventEmitter();
emitter.setMaxListeners(10_000);

let bridgeStarted = false;

export async function startRealtimeBridge() {
  if (bridgeStarted) return;
  bridgeStarted = true;
  const subscriber = createRedisConnection('realtime-subscriber');
  subscriber.on('message', (_channel: string, message: string) => {
    try {
      const event = JSON.parse(message) as RealtimeEvent;
      emitter.emit(event.topic, event);
      emitter.emit('*', event);
    } catch (error) {
      logger.warn({ err: error }, 'Unable to parse realtime event from Redis');
    }
  });
  await subscriber.subscribe(CHANNEL);
  logger.info({ channel: CHANNEL }, 'Realtime Redis bridge subscribed');
}

export function subscribeToRealtime(topic: string, handler: (event: RealtimeEvent) => void) {
  emitter.on(topic, handler);
  return () => emitter.off(topic, handler);
}

export async function publishRealtimeEvent<TPayload>(type: RealtimeEventType, topic: string, payload: TPayload) {
  const event: RealtimeEvent<TPayload> = {
    id: nanoid(16),
    type,
    topic,
    payload,
    occurredAt: new Date().toISOString()
  };

  try {
    await redis.publish(CHANNEL, JSON.stringify(event));
  } catch (error) {
    logger.error({ err: error, eventType: type, topic }, 'Redis realtime publish failed; delivering to local subscribers only');
    emitter.emit(topic, event);
    emitter.emit('*', event);
  }

  return event;
}

export const realtimeTopics = {
  order: (orderId: string) => `order:${orderId}`,
  operations: 'operations',
  store: 'store'
} as const;
