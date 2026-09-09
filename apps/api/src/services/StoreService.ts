import type { StoreSettingsDTO } from '@kob/shared-types';
import { pool } from '../db/pool.js';
import { publishRealtimeEvent, realtimeTopics } from '../realtime/eventBus.js';

function mapStoreSettings(row: Record<string, unknown>): StoreSettingsDTO {
  return {
    isPaused: Boolean(row.is_paused),
    pauseReason: row.pause_reason ? String(row.pause_reason) : null,
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

export class StoreService {
  async getSettings(): Promise<StoreSettingsDTO> {
    const result = await pool.query('SELECT * FROM store_settings WHERE id = 1');
    if (!result.rows[0]) {
      const inserted = await pool.query(
        `INSERT INTO store_settings (id, is_paused) VALUES (1, false)
         ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
         RETURNING *`
      );
      return mapStoreSettings(inserted.rows[0]);
    }
    return mapStoreSettings(result.rows[0]);
  }

  async setPaused(input: { paused: boolean; reason?: string | null; actorUserId: string }): Promise<StoreSettingsDTO> {
    const result = await pool.query(
      `UPDATE store_settings
       SET is_paused = $1, pause_reason = $2, updated_by = $3
       WHERE id = 1
       RETURNING *`,
      [input.paused, input.paused ? input.reason ?? null : null, input.actorUserId]
    );
    const settings = mapStoreSettings(result.rows[0]);

    await publishRealtimeEvent('STORE_UPDATED', realtimeTopics.store, settings);
    await publishRealtimeEvent('STORE_UPDATED', realtimeTopics.operations, settings);

    return settings;
  }
}

export const storeService = new StoreService();
