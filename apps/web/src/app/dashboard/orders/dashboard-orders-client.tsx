'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrderDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api';
import { orderBadgeVariant, orderStatusLabel, paymentBadgeVariant, paymentStatusLabel } from '@/lib/status';

export function DashboardOrdersClient() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ orders: OrderDTO[] }>('/orders/me')
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Please log in to view your dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container-padded py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Customer dashboard</p>
          <h1 className="mt-3 font-[var(--font-display)] text-5xl font-black text-charcoal">Your orders</h1>
        </div>
        <Button asChild variant="outline"><Link href="/menu">Order again</Link></Button>
      </div>

      {loading ? <Card className="glass-card p-8">Loading your order history…</Card> : null}
      {error ? <Card className="border-amber-200 bg-amber-50 p-6 text-amber-950">{error}</Card> : null}
      {!loading && !error && orders.length === 0 ? (
        <Card className="glass-card p-8">
          <h2 className="text-2xl font-black">No orders yet.</h2>
          <p className="mt-2 text-muted-foreground">Place your first King of Barbecue order and it will appear here.</p>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="glass-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black text-charcoal">{order.publicCode}</h2>
                  <Badge variant={orderBadgeVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
                  <Badge variant={paymentBadgeVariant(order.paymentStatus)}>{paymentStatusLabel(order.paymentStatus)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()} · {order.items.length} item(s) · {order.fulfillmentMethod}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xl font-black">{formatMoney(order.totalCents, order.currency)}</p>
                <Button asChild><Link href={`/orders/${order.publicCode}`}>Track</Link></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
