'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import type { OrderDTO, UserDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api';
import { orderBadgeVariant, orderStatusLabel, paymentBadgeVariant, paymentStatusLabel } from '@/lib/status';

export function DashboardOrdersClient() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ user: UserDTO | null }>('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
    apiFetch<{ orders: OrderDTO[] }>('/orders/me')
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Please log in to view your dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  async function signOut() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      router.push('/');
    }
  }

  return (
    <main className="container-padded py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-button text-xs font-normal uppercase tracking-[0.3em] text-primary">Customer dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold text-charcoal sm:text-5xl">Your orders</h1>
          {user ? (
            <p className="mt-2 font-body text-sm font-medium text-muted-foreground">
              Signed in as {user.fullName} · {user.email}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline"><Link href="/menu">Order again</Link></Button>
          {user ? (
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? <Card className="glass-card p-8">Loading your order history…</Card> : null}
      {error ? <Card className="border-amber-200 bg-amber-50 p-6 font-body text-sm font-medium text-amber-950">{error}</Card> : null}
      {!loading && !error && orders.length === 0 ? (
        <Card className="glass-card p-8">
          <h2 className="text-2xl font-semibold">No orders yet.</h2>
          <p className="mt-2 font-body text-sm font-medium text-muted-foreground">Place your first King of Barbecue order and it will appear here.</p>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="glass-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold text-charcoal sm:text-2xl">{order.publicCode}</h2>
                  <Badge variant={orderBadgeVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
                  <Badge variant={paymentBadgeVariant(order.paymentStatus)}>{paymentStatusLabel(order.paymentStatus)}</Badge>
                </div>
                <p className="mt-1 font-body text-sm font-medium text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString()} · {order.items.length} item(s) · {order.fulfillmentMethod}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-body text-lg font-medium text-charcoal">{formatMoney(order.totalCents, order.currency)}</p>
                <Button asChild><Link href={`/orders/${order.publicCode}`}>Track order</Link></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
