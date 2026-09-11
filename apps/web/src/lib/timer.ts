import { isTerminalOrderStatus, type OrderStatus } from '@kob/shared-types';

export interface WaitClockInput {
  /** When the order was created — the clock starts here. */
  startedAt: string;
  /** Current order status. */
  status: OrderStatus;
  /** When the order hit a terminal status. */
  resolvedAt?: string | null | undefined;
  /** Last write to the order; used when `resolvedAt` is not populated yet. */
  fallbackEndAt?: string | null | undefined;
  /** Current time in epoch ms (injected so the maths is testable). */
  now: number;
}

export interface WaitClock {
  /** True while the order is still active and the clock should keep ticking. */
  isRunning: boolean;
  label: 'Waiting' | 'Fulfilled in' | 'Closed after';
  seconds: number;
  minutes: number;
}

function toEpochMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * The waiting clock used by the operations board.
 *
 * Rule: a terminal order (completed / rejected / failed / cancelled) is frozen
 * at its resolution timestamp — it must never keep counting. Orders that are
 * still open count up against `now`.
 */
export function resolveWaitClock({ startedAt, status, resolvedAt, fallbackEndAt, now }: WaitClockInput): WaitClock {
  const start = toEpochMs(startedAt);
  const terminal = isTerminalOrderStatus(status);
  const end = terminal ? (toEpochMs(resolvedAt) ?? toEpochMs(fallbackEndAt) ?? start) : now;

  const seconds = start === null || end === null || end < start ? 0 : Math.floor((end - start) / 1000);

  const label: WaitClock['label'] = !terminal ? 'Waiting' : status === 'COMPLETED' ? 'Fulfilled in' : 'Closed after';

  return { isRunning: !terminal, label, seconds, minutes: Math.floor(seconds / 60) };
}

/** `07:42`, or `1h 04m` once an order crosses an hour. */
export function formatWaitDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  if (safe >= 3600) {
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  const minutes = Math.floor(safe / 60);
  return `${String(minutes).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}
