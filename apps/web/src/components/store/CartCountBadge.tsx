'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CartDTO } from '@kob/shared-types';
import { apiFetch } from '@/lib/api';
import { CART_UPDATED_EVENT } from '@/lib/cart-events';

function itemCount(cart: CartDTO) {
  return cart.items.reduce((total, item) => total + item.quantity, 0);
}

export function CartCountBadge({ className }: { className?: string }) {
  const [count, setCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    try {
      const data = await apiFetch<{ cart: CartDTO }>('/cart', { cache: 'no-store' });
      setCount(itemCount(data.cart));
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    void refreshCartCount();

    window.addEventListener(CART_UPDATED_EVENT, refreshCartCount);
    window.addEventListener('focus', refreshCartCount);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refreshCartCount);
      window.removeEventListener('focus', refreshCartCount);
    };
  }, [refreshCartCount]);

  if (count <= 0) return null;

  return <span className={className}>{count > 99 ? '99+' : count}</span>;
}
