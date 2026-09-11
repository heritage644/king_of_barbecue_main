'use client';

import { useEffect, useState } from 'react';
import type { OrderStatus } from '@kob/shared-types';
import { isTerminalOrderStatus } from '@kob/shared-types';
import { orderStatusLabel, timerTone } from '@/lib/status';

export function ElapsedTimer({ startedAt, status }: { startedAt: string; status: OrderStatus }) {
  const [now, setNow] = useState(() => Date.now());
  const finished = isTerminalOrderStatus(status);

  useEffect(() => {
    if (finished) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [startedAt, finished]);

  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const label = finished ? (status === 'COMPLETED' ? 'Done' : orderStatusLabel(status)) : 'Waiting';
  const tone = finished ? 'text-slate-600 bg-slate-100 border-slate-200' : timerTone(minutes);

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tone}`}>{label}: {display}</span>;
}
