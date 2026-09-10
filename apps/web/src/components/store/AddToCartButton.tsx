'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, ApiError } from '@/lib/api';
import { notifyCartUpdated } from '@/lib/cart-events';

export function AddToCartButton({ productId, disabled = false, withInstructions = false }: { productId: string; disabled?: boolean; withInstructions?: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function add() {
    setIsLoading(true);
    setMessage(null);
    try {
      await apiFetch('/cart/items', {
        method: 'POST',
        json: { productId, quantity, specialInstructions: instructions || undefined }
      });
      notifyCartUpdated();
      setMessage('Added to cart.');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to add item.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {withInstructions ? (
        <>
          <div className="inline-flex items-center rounded-full border border-border bg-white/70 p-1">
            <button
              type="button"
              className="h-9 w-9 rounded-full text-lg font-bold hover:bg-secondary"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center font-bold">{quantity}</span>
            <button
              type="button"
              className="h-9 w-9 rounded-full text-lg font-bold hover:bg-secondary"
              onClick={() => setQuantity((value) => Math.min(50, value + 1))}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <Textarea
            placeholder="Special instructions, e.g. NO PEPPER, extra sauce..."
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            maxLength={500}
          />
        </>
      ) : null}
      <Button onClick={add} disabled={disabled || isLoading} className="w-full sm:w-auto">
        <ShoppingBag className="h-4 w-4" />
        {isLoading ? 'Adding...' : disabled ? 'Unavailable' : 'Add to cart'}
      </Button>
      {message ? <p className="text-sm font-semibold text-primary" role="status">{message}</p> : null}
    </div>
  );
}
