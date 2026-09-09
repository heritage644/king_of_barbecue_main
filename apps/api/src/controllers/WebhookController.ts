import type { Request, Response } from 'express';
import { webhookService } from '../services/WebhookService.js';

export class WebhookController {
  async paymentProvider(req: Request, res: Response) {
    // Phase 1 records idempotent provider events. Future provider-specific services
    // should verify signatures and call payment/order services for domain updates.
    const providerEventId = req.header('x-provider-event-id') ?? (typeof req.body?.id === 'string' ? req.body.id : undefined);
    const providerEventType = typeof req.body?.type === 'string' ? req.body.type : undefined;
    const result = await webhookService.recordPaymentProviderEvent({
      ...(providerEventId ? { eventId: providerEventId } : {}),
      ...(providerEventType ? { eventType: providerEventType } : {}),
      payload: req.body
    });
    res.status(202).json(result);
  }
}

export const webhookController = new WebhookController();
