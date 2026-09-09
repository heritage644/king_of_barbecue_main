'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import type { CartDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api';

export function CartClient() {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadCart() {
    try {
      const data = await apiFetch<{ cart: CartDTO }>('/cart');
      setCart(data.cart);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load cart.');
    }
  }

  useEffect(() => {
    void loadCart();
  }, []);

  async function update(productId: string, quantity: number) {
    setUpdating(productId);
    try {
      const data = await apiFetch<{ cart: CartDTO }>(`/cart/items/${productId}`, {
        method: 'PATCH',
        json: { quantity }
      });
      setCart(data.cart);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update item.');
    } finally {
      setUpdating(null);
    }
  }

  async function remove(productId: string) {
    setUpdating(productId);
    try {
      const data = await apiFetch<{ cart: CartDTO }>(`/cart/items/${productId}`, { method: 'DELETE' });
      setCart(data.cart);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to remove item.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <main className="container-padded py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Your cart</p>
          <h1 className="mt-3 font-[var(--font-display)] text-5xl font-black text-charcoal">Ready for checkout?</h1>
        </div>
        <Button asChild variant="outline"><Link href="/menu">Keep browsing</Link></Button>
      </div>

      {error ? <Card className="mb-6 border-red-200 bg-red-50 p-4 text-red-800">{error}</Card> : null}

      {!cart ? (
        <Card className="glass-card p-8">Loading cart…</Card>
      ) : cart.items.length === 0 ? (
        <Card className="glass-card p-10 text-center">
          <h2 className="text-2xl font-black text-charcoal">Your cart is empty.</h2>
          <p className="mt-2 text-muted-foreground">Add smoky grills, rice meals or chilled drinks before checkout.</p>
          <Button asChild className="mt-6"><Link href="/menu">View menu</Link></Button>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <Card key={item.productId} className="glass-card overflow-hidden p-4">
                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                  <div className="relative min-h-32 overflow-hidden rounded-2xl bg-secondary">
                    {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="140px" className="object-cover" /> : null}
                  </div>
                  <div className="flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-black text-charcoal">{item.name}</h2>
                          {item.specialInstructions ? <p className="mt-1 rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-950">{item.specialInstructions}</p> : null}
                        </div>
                        <p className="font-black">{formatMoney(item.lineTotalCents, item.currency)}</p>
                      </div>
                      {!item.isAvailable ? <p className="mt-2 text-sm font-bold text-red-700">This item is no longer available.</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-border bg-white/70 p-1">
                        <button type="button" className="h-9 w-9 rounded-full text-lg font-bold hover:bg-secondary" disabled={updating === item.productId} onClick={() => update(item.productId, Math.max(0, item.quantity - 1))}>−</button>
                        <span className="w-10 text-center font-bold">{item.quantity}</span>
                        <button type="button" className="h-9 w-9 rounded-full text-lg font-bold hover:bg-secondary" disabled={updating === item.productId} onClick={() => update(item.productId, item.quantity + 1)}>+</button>
                      </div>
                      <Button variant="ghost" onClick={() => remove(item.productId)} disabled={updating === item.productId}>
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="glass-card h-fit p-6">
            <h2 className="text-2xl font-black text-charcoal">Order summary</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">{formatMoney(cart.subtotalCents, cart.currency)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Delivery fee</span><span>Calculated later</span></div>
              <div className="border-t border-border pt-3 text-lg font-black flex justify-between"><span>Total</span><span>{formatMoney(cart.subtotalCents, cart.currency)}</span></div>
            </div>
            <Button asChild size="lg" className="mt-6 w-full"><Link href="/checkout">Checkout as guest</Link></Button>
          </Card>
        </div>
      )}
    </main>
  );
}
