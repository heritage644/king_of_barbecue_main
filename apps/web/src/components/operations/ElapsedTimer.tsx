'use client';

import { useEffect, useState } from 'react';
import type { OrderStatus } from '@kob/shared-types';
import { formatWaitDuration, resolveWaitClock } from '@/lib/timer';
import { timerTone } from '@/lib/status';

interface ElapsedTimerProps {
  /** When the clock starts (order creation). */
  startedAt: string;
  /** Current order status — a terminal status stops the clock. */
  status: OrderStatus;
  /** When the order was resolved. Falls back to `fallbackEndAt` when absent. */
  resolvedAt?: string | null | undefined;
  /** Last touch of the record, used if `resolvedAt` is not available yet. */
  fallbackEndAt?: string | null | undefined;
  className?: string;
}

/**
 * Waiting clock for the operations board and order detail screens.
 *
 * It only ticks while an order is active: as soon as the order is completed (or
 * rejected/failed/cancelled) the interval is torn down and the pill reports the
 * time the order actually took. The pill is `flex-none` + truncating so it can
 * never push out of — or over — its card, however narrow a board column is.
 */
export function ElapsedTimer({ startedAt, status, resolvedAt, fallbackEndAt, className = '' }: ElapsedTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  const clock = resolveWaitClock({ startedAt, status, resolvedAt, fallbackEndAt, now });
  const { isRunning, label, minutes } = clock;

  useEffect(() => {
    // Resolved orders are frozen — no interval, no re-renders.
    if (!isRunning) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [startedAt, status, resolvedAt, fallbackEndAt, isRunning]);

  const display = formatWaitDuration(clock.seconds);

  const tone = isRunning
    ? timerTone(minutes)
    : status === 'COMPLETED'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-gray-200 bg-gray-100 text-gray-600';

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 font-button text-[11px] font-normal tabular-nums sm:text-xs ${tone} ${className}`}
      title={`${label} ${display}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 flex-none rounded-full bg-current ${isRunning ? 'animate-pulse' : 'opacity-60'}`}
      />
      <span className="truncate">
        {label}: {display}
      </span>
    </span>
  );
}
