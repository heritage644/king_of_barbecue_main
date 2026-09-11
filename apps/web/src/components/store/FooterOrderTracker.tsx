'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ReceiptText } from 'lucide-react';

/**
 * "Where is my food?" shortcut for the footer. Accepts the full order code
 * (ORD-XXXXXXXX) or just the random suffix and routes to the live tracking page.
 */
export function FooterOrderTracker() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim().toUpperCase().replace(/\s+/g, '');
    if (trimmed.length < 5) {
      setError('Enter the order code from your confirmation page.');
      return;
    }
    setError(null);
    const normalized = trimmed.startsWith('ORD-') ? trimmed : `ORD-${trimmed}`;
    router.push(`/orders/${encodeURIComponent(normalized)}`);
  }

  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <label htmlFor="footer-order-code" className="font-heading text-sm font-semibold text-white">
        Track an order
      </label>
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1 transition focus-within:border-primary">
        <ReceiptText className="ml-2 h-4 w-4 flex-none text-white/50" aria-hidden />
        <input
          id="footer-order-code"
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="ORD-XXXXXXXX"
          autoComplete="off"
          className="w-full min-w-0 bg-transparent font-body text-sm font-medium text-white outline-none placeholder:text-white/40"
        />
        <button
          type="submit"
          className="inline-flex h-8 flex-none items-center gap-1 rounded-full bg-primary px-3 font-button text-[13px] font-normal text-white transition hover:bg-ember-700"
        >
          Track
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      {error ? (
        <p className="font-body text-xs font-medium text-amber-300" role="alert">
          {error}
        </p>
      ) : (
        <p className="font-body text-xs font-medium text-white/50">Live status updates, no sign-in needed.</p>
      )}
    </form>
  );
}
