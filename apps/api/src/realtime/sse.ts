import type { Request, Response } from 'express';
import type { RealtimeEvent } from '@kob/shared-types';
import { subscribeToRealtime } from './eventBus.js';

export function prepareSse(req: Request, res: Response) {
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write(': connected\n\n');
}

export function writeSse(res: Response, event: RealtimeEvent) {
  res.write(`id: ${event.id}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function streamTopic(req: Request, res: Response, topic: string, initialEvents: RealtimeEvent[] = []) {
  prepareSse(req, res);
  for (const event of initialEvents) writeSse(res, event);

  const unsubscribe = subscribeToRealtime(topic, (event) => writeSse(res, event));
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
}
