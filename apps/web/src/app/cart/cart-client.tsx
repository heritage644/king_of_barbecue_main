'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
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
    <main className="mx-auto min-h-screen max-w-md bg-[#FAFAFA] px-4 py-6 sm:px-6 md:max-w-2xl lg:max-w-5xl lg:px-8 lg:py-10">
      {/* Top Header with Back Navigation */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/menu"
          aria-label="Back to menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[#151515] sm:text-3xl">My Cart</h1>
      </div>

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </Card>
      ) : null}

      {!cart ? (
        <Card className="p-8 text-center text-xs text-gray-400">Loading cart…</Card>
      ) : cart.items.length === 0 ? (
        /* Empty Cart State */
        <div className="mx-auto max-w-md">
          <Card className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50/60 text-primary">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-[#151515]">Your Cart Is Empty</h2>
            <p className="mt-1 text-xs text-gray-400">Looks like you haven't added anything yet</p>
            <Button
              asChild
              variant="outline"
              className="mt-6 w-full rounded-2xl border-primary text-xs font-bold text-primary hover:bg-orange-50 hover:text-primary"
            >
              <Link href="/menu">Browse menu</Link>
            </Button>
          </Card>
        </div>
      ) : (
        /* Responsive Grid: Stacks on Mobile/Tablet, Splits on Desktop */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
          
          {/* Cart Items List */}
          <div className="space-y-3">
            {cart.items.map((item) => (
              <Card
                key={item.productId}
                className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4"
              >
                <div className="flex gap-3 sm:gap-4">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 80px, 96px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  {/* Content Container */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h2 className="text-sm font-bold text-[#151515] sm:text-base">{item.name}</h2>
                        {/* Variant Badge */}
                        <span className="text-[11px] font-medium text-emerald-600 sm:text-xs">
                          {item.specialInstructions || 'Medium'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-bold text-primary sm:text-sm">
                        {formatMoney(item.lineTotalCents, item.currency)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Black Stepper Pill */}
                      <div className="flex items-center rounded-lg bg-[#151515] px-2 py-1 text-white">
                        <button
                          type="button"
                          className="p-1 disabled:opacity-40"
                          disabled={updating === item.productId}
                          onClick={() => update(item.productId, Math.max(0, item.quantity - 1))}
                        >
                          <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold sm:w-8 sm:text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          className="p-1 disabled:opacity-40"
                          disabled={updating === item.productId}
                          onClick={() => update(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                      </div>

                      {/* Trash Button */}
                      <button
                        type="button"
                        onClick={() => remove(item.productId)}
                        disabled={updating === item.productId}
                        className="p-1 text-gray-300 transition-colors hover:text-red-500"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pricing & Checkout Block (Desktop Sticky) */}
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-8">
            <h2 className="hidden text-base font-bold text-[#151515] lg:mb-4 lg:block">Order Summary</h2>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-primary">
                <span>Delivery charge</span>
                <span className="font-bold">₦0</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#151515] sm:text-lg">
                <span>Total</span>
                <span>{formatMoney(cart.subtotalCents, cart.currency)}</span>
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="mt-4 h-12 w-full rounded-2xl bg-primary text-sm font-bold text-white shadow-md hover:bg-primary/90"
            >
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
          </div>

        </div>
      )}
    </main>
  );
}