'use client';

import type { FormEvent, InputHTMLAttributes } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { CartDTO, FulfillmentMethod, PaymentMethod, RealtimeEvent, StoreSettingsDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch, apiProxyBase, ApiError } from '@/lib/api';

export function CheckoutClient() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [store, setStore] = useState<StoreSettingsDTO | null>(null);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('DELIVERY');
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
    <main className="mx-auto min-h-screen max-w-md bg-[#FAFAFA] px-4 py-6 sm:px-6 md:max-w-2xl lg:max-w-5xl lg:px-8 lg:py-10">
      {/* Navigation Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/cart"
          aria-label="Back to cart"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[#151515] sm:text-3xl">Checkout</h1>
      </div>

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </Card>
      ) : null}

      {store?.isPaused ? (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-950">
          Services are temporarily on hold. Ordering is currently disabled.
        </Card>
      ) : null}

      <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8">
        
        {/* Left Column: Details Form */}
        <div className="space-y-6">
          
          {/* Your Details */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-[#151515]">Your Details</h2>
            <div className="space-y-3">
              <Field
                label="Full name"
                name="fullName"
                placeholder="John Doe"
                autoComplete="name"
                required
              />
              <Field
                label="Phone no."
                name="phone"
                type="tel"
                placeholder="+234 81 234 5678"
                autoComplete="tel"
                required
              />
              <Field
                label="Email"
                name="email"
                type="email"
                placeholder="john@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Order Type Toggle Segment */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-[#151515]">Order Type</h2>
            <div className="flex rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setFulfillmentMethod('PICKUP')}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  fulfillmentMethod === 'PICKUP'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Pick Up
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentMethod('DELIVERY')}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  fulfillmentMethod === 'DELIVERY'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Delivery
              </button>
            </div>
          </div>

          {/* Delivery Fields */}
          {fulfillmentMethod === 'DELIVERY' ? (
            <div className="space-y-3">
              <Field
                label="Delivery Address"
                name="deliveryAddress"
                placeholder="123 Main Street GRA"
                required
              />
              <Field
                label="Area Location"
                name="deliveryArea"
                placeholder="Lekki Phase 1"
                required
              />
            </div>
          ) : null}

        </div>

        {/* Right Column: Order Items Preview & Place Order */}
        <div className="space-y-6 lg:sticky lg:top-8">
          
          {/* Item List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-[#151515]">Order Summary</h2>
            {!cart ? (
              <p className="text-xs text-gray-400">Loading order items…</p>
            ) : cart.items.length === 0 ? (
              <p className="text-xs text-gray-400">Your cart is empty.</p>
            ) : (
              cart.items.map((item) => (
                <Card
                  key={item.productId}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <h3 className="text-xs font-bold text-[#151515]">{item.name}</h3>
                        <span className="text-[10px] font-medium text-emerald-600">
                          {item.specialInstructions || 'Medium'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-primary">
                        {formatMoney(item.lineTotalCents, item.currency)}
                      </p>
                      <p className="text-[11px] font-medium text-gray-400">x{item.quantity}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Delivery Charge & Actions */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-primary">
                <span>Delivery charge</span>
                <span className="font-bold">₦0</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#151515]">
                <span>Total</span>
                <span>{formatMoney(cart?.subtotalCents ?? 0, cart?.currency ?? 'NGN')}</span>
              </div>
            </div>

            <Button
              size="lg"
              type="submit"
              disabled={isSubmitting || !cart?.items.length || store?.isPaused}
              className="h-12 w-full rounded-2xl bg-primary text-sm font-bold text-white shadow-md hover:bg-primary/90"
            >
              {isSubmitting ? 'Placing Order…' : 'Place Order'}
            </Button>
          </div>

        </div>

      </form>
    </main>
  );
}

function Field({
  label,
  name,
  className,
  ...props
}: { label: string; name: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <label htmlFor={name} className="text-[11px] font-medium text-gray-400">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="w-full rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 text-xs font-medium text-[#151515] shadow-sm outline-none transition placeholder:text-gray-300 focus:border-primary"
        {...props}
      />
    </div>
  );
}