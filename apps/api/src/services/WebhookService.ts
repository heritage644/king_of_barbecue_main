import crypto from 'node:crypto';
import { pool } from '../db/pool.js';

export class WebhookService {
  async recordPaymentProviderEvent(input: { eventId?: string; eventType?: string; payload: unknown }) {
    const eventId = input.eventId ?? crypto.randomUUID();
    const eventType = input.eventType ?? 'unknown';
    await pool.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, payload)
       VALUES ('future-payment-provider', $1, $2, $3)
       ON CONFLICT (provider, event_id) DO NOTHING`,
      [eventId, eventType, input.payload]
    );
    return { accepted: true, eventId };
  }
}

export const webhookService = new WebhookService();
