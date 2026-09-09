import type { Request, Response } from 'express';
import { streamTopic } from '../realtime/sse.js';
import { realtimeTopics } from '../realtime/eventBus.js';
import { storeService } from '../services/StoreService.js';

export class StoreController {
  async getSettings(_req: Request, res: Response) {
    res.json({ store: await storeService.getSettings() });
  }

  async pause(req: Request, res: Response) {
    res.json({ store: await storeService.setPaused({ paused: true, reason: req.body.reason, actorUserId: req.user!.id }) });
  }

  async resume(req: Request, res: Response) {
    res.json({ store: await storeService.setPaused({ paused: false, actorUserId: req.user!.id }) });
  }

  async stream(req: Request, res: Response) {
    streamTopic(req, res, realtimeTopics.store);
  }
}

export const storeController = new StoreController();
