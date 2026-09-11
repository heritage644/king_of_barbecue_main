'use client';

import { useEffect, useState } from 'react';
import type { RealtimeEvent, StoreSettingsDTO } from '@kob/shared-types';
import type { StoreSchedule } from '@/lib/site';
import { apiFetch, apiProxyBase } from '@/lib/api';

type StoreState = 'checking' | 'open' | 'paused' | 'closed';

/**
 * Live "open / on hold" indicator for the footer: it combines the restaurant
 * schedule with the operations pause switch, and keeps itself current through
 * the same Server-Sent Events stream the header banner uses.
 */
export function FooterStoreStatus({ hours }: { hours: readonly StoreSchedule[] }) {
  const [store, setStore] = useState<StoreSettingsDTO | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let mounted = true;
    apiFetch<{ store: StoreSettingsDTO }>('/store/settings')
      .then((data) => mounted && setStore(data.store))
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

    // Re-evaluate "open now" as the clock crosses opening/closing times.
    const minuteTimer = setInterval(() => setNow(new Date()), 60_000);

    return () => {
      mounted = false;
      source.close();
      clearInterval(minuteTimer);
    };
  }, []);

  const todaysSchedule: StoreSchedule = hours.find((entry) => entry.weekdays.includes(now.getDay())) ?? {
    days: 'Every day',
    time: 'Call to confirm',
    openHour: null,
    closeHour: null,
    weekdays: [0, 1, 2, 3, 4, 5, 6]
  };

  const decimalHour = now.getHours() + now.getMinutes() / 60;
  const withinHours =
    todaysSchedule.openHour !== null &&
    todaysSchedule.closeHour !== null &&
    decimalHour >= todaysSchedule.openHour &&
    decimalHour < todaysSchedule.closeHour;

  const state: StoreState = store === null ? 'checking' : store.isPaused ? 'paused' : withinHours ? 'open' : 'closed';

  const closesAt = todaysSchedule.time.split('–').pop()?.trim();
  const copy: Record<StoreState, { dot: string; label: string }> = {
    checking: { dot: 'bg-white/40', label: 'Checking service status…' },
    open: { dot: 'bg-emerald-400', label: `Open now${closesAt ? ` · until ${closesAt}` : ''}` },
    closed: { dot: 'bg-amber-300', label: `Closed right now · ${todaysSchedule.days}, ${todaysSchedule.time}` },
    paused: { dot: 'bg-red-400', label: store?.pauseReason ? `On hold · ${store.pauseReason}` : 'Kitchen on hold' }
  };

  return (
    <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-button text-[13px] font-normal text-white/80">
      <span
        aria-hidden
        className={`h-2 w-2 flex-none rounded-full ${copy[state].dot}${state === 'open' ? ' animate-pulse' : ''}`}
      />
      <span className="truncate">{copy[state].label}</span>
    </p>
  );
}
