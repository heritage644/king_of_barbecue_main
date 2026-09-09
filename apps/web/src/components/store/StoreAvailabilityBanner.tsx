'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { StoreSettingsDTO, RealtimeEvent } from '@kob/shared-types';
import { apiFetch, apiProxyBase } from '@/lib/api';

export function StoreAvailabilityBanner() {
  const [store, setStore] = useState<StoreSettingsDTO | null>(null);

  useEffect(() => {
    let mounted = true;
    apiFetch<{ store: StoreSettingsDTO }>('/store/settings')
      .then((data) => {
        if (mounted) setStore(data.store);
      })
      .catch(() => undefined);

    const source = new EventSource(`${apiProxyBase}/store/stream`, { withCredentials: true });
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as RealtimeEvent<StoreSettingsDTO>;
        if (event.type === 'STORE_UPDATED') setStore(event.payload);
      } catch {
        // Ignore malformed realtime payloads.
      }
    };

    return () => {
      mounted = false;
      source.close();
    };
  }, []);

  if (!store?.isPaused) return null;

  return (
    <div className="border-y border-amber-300 bg-amber-100 text-amber-950" role="status" aria-live="polite">
      <div className="container-padded flex items-start gap-3 py-3 text-sm font-semibold">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
        <span>{store.pauseReason || 'Services are temporarily on hold. We will resume shortly.'}</span>
      </div>
    </div>
  );
}
