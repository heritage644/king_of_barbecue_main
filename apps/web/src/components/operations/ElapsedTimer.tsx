'use client';

import { useEffect, useState } from 'react';
import { timerTone } from '@/lib/status';

export function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${timerTone(minutes)}`}>Waiting: {display}</span>;
}
