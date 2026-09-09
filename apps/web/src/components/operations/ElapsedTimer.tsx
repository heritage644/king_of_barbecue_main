'use client';

import { useEffect, useState } from 'react';
import { activeMinutesSince, timerTone } from '@/lib/status';

export function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [minutes, setMinutes] = useState(() => activeMinutesSince(startedAt));

  useEffect(() => {
    const interval = setInterval(() => setMinutes(activeMinutesSince(startedAt)), 30_000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const display = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${timerTone(minutes)}`}>Waiting: {display}</span>;
}
