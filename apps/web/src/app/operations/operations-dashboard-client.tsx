'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Bell, BellOff, Search } from 'lucide-react';
import type { OrderDTO, OrderStatus, RealtimeEvent, UserRole } from '@kob/shared-types';
import { formatMoney, ORDER_STATUSES, PAYMENT_STATUSES } from '@kob/shared-types';
import { ElapsedTimer } from '@/components/operations/ElapsedTimer';
import { StorePauseControl } from '@/components/operations/StorePauseControl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch, apiProxyBase, ApiError } from '@/lib/api';
import { orderBadgeVariant, orderStatusLabel, paymentBadgeVariant, paymentStatusLabel } from '@/lib/status';

const groups: { title: string; statuses: OrderStatus[] }[] = [
  { title: 'New / Pending', statuses: ['PENDING'] },
  { title: 'In progress', statuses: ['APPROVED', 'IN_PREPARATION', 'READY'] },
  { title: 'Out for delivery', statuses: ['OUT_FOR_DELIVERY'] },
  { title: 'Completed', statuses: ['COMPLETED'] },
  { title: 'Failed / Cancelled', statuses: ['REJECTED', 'FAILED', 'CANCELLED'] }
];

interface SessionUser {
  id: string;
  email: string;
  roles: UserRole[];
}

export function OperationsDashboardClient() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  async function loadOrders(query = '') {
    setLoading(true);
    try {
      const data = await apiFetch<{ orders: OrderDTO[]; total: number }>(`/operations/orders${query}`);
      setOrders(data.orders);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load operational orders.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    apiFetch<{ user: SessionUser | null }>('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
    void loadOrders();
  }, []);
  const maybePlayAlert = useCallback((eventId: string) => {
    const key = `handled-order-event:${eventId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'true');
    if (!audioEnabled) return;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const context = audioRef.current ?? new AudioCtx();
    audioRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.06;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  }, [audioEnabled]);
  useEffect(() => {
    const source = new EventSource(`${apiProxyBase}/operations/stream`, { withCredentials: true });
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as RealtimeEvent<OrderDTO>;
        if (event.type === 'ORDER_CREATED' || event.type === 'ORDER_UPDATED' || event.type === 'PAYMENT_UPDATED') {
          setOrders((current) => upsertOrder(current, event.payload));
          if (event.type === 'ORDER_CREATED') maybePlayAlert(event.id);
        }
      } catch {
        // Ignore malformed SSE data.
      }
    };
    return () => source.close();
  }, [maybePlayAlert]);
  const counts = useMemo(() => {
    return groups.map((group) => ({ title: group.title, count: orders.filter((order) => group.statuses.includes(order.status)).length }));
  }, [orders]);
  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ['q', 'status', 'paymentStatus', 'fulfillmentMethod']) {
      const value = String(form.get(key) ?? '');
      if (value) params.set(key, value);
    }
    await loadOrders(params.toString() ? `?${params.toString()}` : '');
  }
  async function quickAction(orderId: string, action: 'approve' | 'paid') {
    try {
      const endpoint = action === 'approve'
        ? `/operations/orders/${orderId}/approve`
        : `/operations/orders/${orderId}/payment`;
      const data = await apiFetch<{ order: OrderDTO }>(endpoint, {
        method: 'PATCH',
        json: action === 'paid'
          ? {
              paymentStatus: 'PAID',
              reasonNote: 'Marked paid via dashboard operator quick action'
            }
          : undefined
      });
      setOrders((current) => upsertOrder(current, data.order));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    }
  }
  if (error?.includes('Authentication')) {
    return (
      <main className="container-padded py-12">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h1 className="text-3xl font-semibold">Staff sign-in required</h1>
          <p className="mt-2 font-body text-sm font-medium text-muted-foreground">Please sign in with an operational staff account.</p>
          <Button asChild className="mt-6"><Link href="/operations/login">Go to login</Link></Button>
        </Card>
      </main>
    );
  }
  return (
    <main className="container-padded space-y-6 py-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="font-button text-xs font-normal uppercase tracking-[0.3em] text-primary">KING OF BARBECUE</p>
          <h1 className="mt-2 text-3xl font-semibold text-destructive sm:text-4xl">Order board</h1>
          <p className="mt-2 font-body text-sm font-medium text-muted-foreground">{user ? `Signed in as ${user.email}` : 'Checking session…'} · {total} order(s) this period</p>
        </div>
        <Button variant={audioEnabled ? 'default' : 'outline'} onClick={() => setAudioEnabled((enabled) => !enabled)}>
          {audioEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          {audioEnabled ? 'Audio alerts on' : 'Enable audio alerts'}
        </Button>
      </div>
      <StorePauseControl />
      <Card className="p-4">
        <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-[1fr_repeat(3,minmax(0,180px))_auto]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input name="q" placeholder="Search order, customer, phone" className="pl-9" />
          </div>
          <select name="status" className="h-11 w-full min-w-0 rounded-2xl border border-input bg-white/80 px-3 font-body text-sm font-medium"><option value="">Any status</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select>
          <select name="paymentStatus" className="h-11 w-full min-w-0 rounded-2xl border border-input bg-white/80 px-3 font-body text-sm font-medium"><option value="">Any payment</option>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{paymentStatusLabel(status)}</option>)}</select>
          <select name="fulfillmentMethod" className="h-11 w-full min-w-0 rounded-2xl border border-input bg-white/80 px-3 font-body text-sm font-medium"><option value="">Any fulfillment</option><option value="PICKUP">Pickup</option><option value="DELIVERY">Delivery</option></select>
          <Button type="submit">Filter</Button>
        </form>
      </Card>
      {error ? <Card className="border-red-200 bg-red-50 p-4 font-body text-sm font-medium text-red-800">{error}</Card> : null}
      {loading ? <Card className="glass-card p-8">Loading orders…</Card> : null}
      <div className="grid grid-cols-2 gap-2 font-body text-xs font-medium sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 xl:hidden">
        {counts.map((item) => (
          <div
            key={item.title}
            className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-white p-2.5 shadow-sm sm:flex-col sm:items-start sm:gap-1 sm:p-3"
          >
            <span className="min-w-0 truncate text-gray-600">{item.title}</span>
            <span className="flex-none text-lg font-semibold text-gray-900 sm:text-base">{item.count}</span>
          </div>
        ))}
      </div>
      <section className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {groups.map((group) => {
          const groupOrders = orders.filter((order) => group.statuses.includes(order.status));
          return (
            <div key={group.title} className="min-w-0 rounded-[1.5rem] border border-border/80 bg-white/50 p-3">
              <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
                <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">{group.title}</h2>
                <span className="flex-none rounded-full bg-foreground px-2.5 py-1 font-button text-[11px] font-normal text-white">{groupOrders.length}</span>
              </div>
              <div className="space-y-3">
                {groupOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onApprove={() =>
                    quickAction(order.id, 'approve')} onPaid={() => quickAction(order.id, 'paid')} />
                ))}
                {!groupOrders.length ? <p className="rounded-2xl border border-dashed border-border p-4 font-body text-xs font-medium text-muted-foreground">No orders here.</p> : null}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

function OrderCard({ order, onApprove, onPaid }: { order: OrderDTO; onApprove: () => void; onPaid: () => void }) {
  return (
    <Card className="overflow-hidden bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <div className="min-w-0 max-w-full flex-1">
          <Link href={`/operations/orders/${order.id}`} className="block truncate text-base font-semibold text-destructive hover:text-primary sm:text-lg">{order.publicCode}</Link>
          <p className="truncate font-body text-xs font-medium text-muted-foreground">{order.guestName}</p>
        </div>
        <ElapsedTimer
          className="flex-none"
          startedAt={order.createdAt}
          status={order.status}
          resolvedAt={order.resolvedAt}
          fallbackEndAt={order.updatedAt}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={orderBadgeVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
        <Badge variant={paymentBadgeVariant(order.paymentStatus)}>{paymentStatusLabel(order.paymentStatus)}</Badge>
      </div>
      <div className="mt-4 space-y-2 font-body text-sm font-medium">
        <div className="flex min-w-0 items-center justify-between gap-2"><span className="truncate">{order.items.length} item(s)</span><span className="flex-none font-semibold">{formatMoney(order.totalCents, order.currency)}</span></div>
        <div className="truncate text-muted-foreground">{order.fulfillmentMethod === 'DELIVERY' ? order.deliveryArea || 'Delivery' : 'Pickup'}</div>
      </div>
      <div className="mt-4 grid gap-2">
        {order.paymentStatus !== 'PAID' && order.paymentStatus !== 'REFUNDED' ? <Button size="sm" variant="outline" onClick={onPaid}>Mark paid</Button> : null}
        {order.status === 'PENDING' ? <Button size="sm" onClick={onApprove}>Approve</Button> : null}
        <Button size="sm" variant="dark" asChild><Link href={`/operations/orders/${order.id}`} className="block truncate">Open details</Link></Button>
      </div>
    </Card>
  );
}

function upsertOrder(orders: OrderDTO[], order: OrderDTO) {
  const existing = orders.findIndex((item) => item.id === order.id);
  if (existing === -1) return [order, ...orders];
  const copy = [...orders];
  copy[existing] = order;
  return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

