'use client';

import { useEffect, useState } from 'react';
import type { StoreSettingsDTO, RealtimeEvent } from '@kob/shared-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch, apiProxyBase, ApiError } from '@/lib/api';

export function StorePauseControl() {
  const [store, setStore] = useState<StoreSettingsDTO | null>(null);
  const [reason, setReason] = useState('Services are temporarily on hold. Please check back shortly.');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ store: StoreSettingsDTO }>('/store/settings').then((data) => setStore(data.store)).catch(() => undefined);
    const source = new EventSource(`${apiProxyBase}/store/stream`, { withCredentials: true });
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as RealtimeEvent<StoreSettingsDTO>;
        if (event.type === 'STORE_UPDATED') setStore(event.payload);
      } catch {}
    };
    return () => source.close();
  }, []);

  async function setPaused(paused: boolean) {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ store: StoreSettingsDTO }>(paused ? 
        '/operations/store/pause' : '/operations/store/resume', {
        method: 'POST',
        json: paused ? { reason } : undefined
      });
      setStore(data.store);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update store status.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={`p-4 ${store?.isPaused ? 'border-amber-300 bg-amber-50' : 'bg-white/80'}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em]
           text-primary">Store availability</p>
          <p className="font-bold text-charcoal">{store?.isPaused ? 'King of barbecue is currently paused' : 'We are live and accepting orders accepting orders'}</p>
          {store?.pauseReason ? <p className="text-sm text-muted-foreground">{store.pauseReason}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {!store?.isPaused ? <Input value={reason} onChange={(event) => setReason(event.target.value)} className="min-w-72" aria-label="Pause reason" /> : null}
          {store?.isPaused ? (
            <Button onClick={() => setPaused(false)} disabled={loading}>Resume store</Button>
          ) : (
            <Button variant="outline" onClick={() => setPaused(true)} disabled={loading}>Pause store</Button>
          )}
        </div>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </Card>
  );
}
