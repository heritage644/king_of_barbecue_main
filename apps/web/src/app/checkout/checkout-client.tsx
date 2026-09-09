'use client';

import type { FormEvent, InputHTMLAttributes } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CartDTO, FulfillmentMethod, PaymentMethod, RealtimeEvent, StoreSettingsDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, apiProxyBase, ApiError } from '@/lib/api';

export function CheckoutClient() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [store, setStore] = useState<StoreSettingsDTO | null>(null);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('PICKUP');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MANUAL_TRANSFER');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    void Promise.all([
      apiFetch<{ cart: CartDTO }>('/cart').then((data) => setCart(data.cart)),
      apiFetch<{ store: StoreSettingsDTO }>('/store/settings').then((data) => setStore(data.store))
    ]).catch((err) => setError(err instanceof ApiError ? err.message : 'Unable to prepare checkout.'));

    const source = new EventSource(`${apiProxyBase}/store/stream`, { withCredentials: true });
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as RealtimeEvent<StoreSettingsDTO>;
        if (event.type === 'STORE_UPDATED') setStore(event.payload);
      } catch {}
    };
    return () => source.close();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      const data = await apiFetch<{ order: { publicCode: string } }>('/orders', {
        method: 'POST',
        json: {
          fullName: String(form.get('fullName') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: String(form.get('phone') ?? ''),
          fulfillmentMethod,
          deliveryAddress: String(form.get('deliveryAddress') ?? '') || undefined,
          deliveryArea: String(form.get('deliveryArea') ?? '') || undefined,
          deliveryInstructions: String(form.get('deliveryInstructions') ?? '') || undefined,
          paymentMethod,
          idempotencyKey
        }
      });
      router.push(`/orders/${data.order.publicCode}?confirmed=1`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to place order.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="container-padded py-12">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Guest checkout</p>
        <h1 className="mt-3 font-[var(--font-display)] text-5xl font-black text-charcoal">Confirm your details.</h1>
        <p className="mt-3 text-muted-foreground">No account required. You can save your details after the order is placed.</p>
      </div>

      {error ? <Card className="mb-6 border-red-200 bg-red-50 p-4 text-red-800">{error}</Card> : null}
      {store?.isPaused ? <Card className="mb-6 border-amber-200 bg-amber-50 p-4 font-semibold text-amber-950">Services are temporarily on hold. New checkout is disabled until the restaurant resumes ordering.</Card> : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <Card className="glass-card p-6">
          <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="fullName" autoComplete="name" required />
              <Field label="Email" name="email" type="email" autoComplete="email" required />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" required />
            </div>

            <div className="space-y-3">
              <Label>Fulfillment method</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {(['PICKUP', 'DELIVERY'] as const).map((method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setFulfillmentMethod(method)}
                    className={`rounded-[1.25rem] border p-4 text-left font-bold transition ${fulfillmentMethod === method ? 'border-primary bg-primary text-primary-foreground shadow-glow' : 'border-border bg-white/70 hover:bg-white'}`}
                  >
                    {method === 'PICKUP' ? 'Pickup' : 'Delivery'}
                    <span className="block text-sm font-medium opacity-80">{method === 'PICKUP' ? 'Collect at the restaurant.' : 'Send to your address.'}</span>
                  </button>
                ))}
              </div>
            </div>

            {fulfillmentMethod === 'DELIVERY' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Delivery area" name="deliveryArea" required />
                <Field label="Delivery address" name="deliveryAddress" required className="sm:col-span-2" />
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="deliveryInstructions">Delivery instructions</Label>
                  <Textarea id="deliveryInstructions" name="deliveryInstructions" placeholder="Landmark, gate code, call instructions…" />
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <Label>Payment method</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {(['MANUAL_TRANSFER', 'CASH_ON_DELIVERY'] as const).map((method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-[1.25rem] border p-4 text-left font-bold transition ${paymentMethod === method ? 'border-charcoal bg-charcoal text-white' : 'border-border bg-white/70 hover:bg-white'}`}
                  >
                    {method === 'MANUAL_TRANSFER' ? 'Manual transfer' : 'Cash on delivery'}
                    <span className="block text-sm font-medium opacity-80">{method === 'MANUAL_TRANSFER' ? 'Staff will verify payment.' : 'Pay when your order arrives.'}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button size="lg" type="submit" disabled={isSubmitting || !cart?.items.length || store?.isPaused} className="w-full sm:w-auto">
              {isSubmitting ? 'Placing order…' : 'Place order'}
            </Button>
          </form>
        </Card>

        <Card className="glass-card h-fit p-6">
          <h2 className="text-2xl font-black text-charcoal">Cart summary</h2>
          {!cart ? <p className="mt-4 text-muted-foreground">Loading…</p> : cart.items.length === 0 ? (
            <div className="mt-4 text-muted-foreground">
              Your cart is empty. <Link className="font-bold text-primary" href="/menu">View menu</Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-4 text-sm">
                  <span>{item.quantity} × {item.name}</span>
                  <span className="font-bold">{formatMoney(item.lineTotalCents, item.currency)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-4 text-lg font-black flex justify-between">
                <span>Total</span>
                <span>{formatMoney(cart.subtotalCents, cart.currency)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

function Field({ label, name, className, ...props }: { label: string; name: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
