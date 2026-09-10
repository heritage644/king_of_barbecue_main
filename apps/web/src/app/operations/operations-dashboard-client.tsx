'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, BellOff, User, Search } from 'lucide-react';
import type { OrderDTO, OrderStatus, RealtimeEvent, UserRole } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch, apiProxyBase, ApiError } from '@/lib/api';

interface SessionUser {
  id: string;
  email: string;
  name?: string;
  roles: UserRole[];
}

export function OperationsDashboardClient() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const audioRef = useRef<AudioContext | null>(null);

  // FIXED: Clean empty query parameters to prevent 400 validation errors
  const loadOrders = useCallback(async (paramsObject?: Record<string, string>) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (paramsObject) {
        Object.entries(paramsObject).forEach(([key, value]) => {
          if (value && value.trim() !== '') {
            queryParams.set(key, value.trim());
          }
        });
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const data = await apiFetch<{ orders: OrderDTO[]; total: number }>(`/operations/orders${queryString}`);
      setOrders(data.orders);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load operational orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    apiFetch<{ user: SessionUser | null }>('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
    void loadOrders();
  }, [loadOrders]);

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

  // SSE Listener
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
        // Ignore malformed SSE data
      }
    };
    return () => source.close();
  }, [maybePlayAlert]);

  // Tab Filtering logic
  const filteredOrders = useMemo(() => {
    if (activeTab === 'PENDING') return orders.filter((o) => o.status === 'PENDING');
    if (activeTab === 'PAID') return orders.filter((o) => o.paymentStatus === 'PAID');
    return orders;
  }, [orders, activeTab]);

  const counts = useMemo(() => ({
    all: total || orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    paid: orders.filter((o) => o.paymentStatus === 'PAID').length
  }), [orders, total]);

  // FIXED: Quick action PATCH body now passes explicit empty object instead of undefined
  async function quickAction(orderId: string, action: 'approve' | 'paid') {
    try {
      const endpoint = action === 'approve' ? `/operations/orders/${orderId}/approve` : `/operations/orders/${orderId}/payment`;
      const payload = action === 'paid' ? { paymentStatus: 'PAID' } : {};
      
      const data = await apiFetch<{ order: OrderDTO }>(endpoint, {
        method: 'PATCH',
        json: payload
      });
      setOrders((current) => upsertOrder(current, data.order));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    }
  }

  if (error?.includes('Authentication')) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-12">
        <Card className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#151515]">Staff sign-in required</h1>
          <p className="mt-2 text-xs text-gray-400">Please sign in with an operational staff account.</p>
          <Button asChild className="mt-6 h-12 w-full rounded-2xl bg-primary font-bold text-white">
            <Link href="/operations/login">Go to login</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#FAFAFA] px-4 py-6 sm:px-6 md:max-w-2xl lg:max-w-4xl">
      
      {/* Figma Header Profile */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border border-gray-100 bg-white shadow-sm">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              className="object-contain p-1"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400">Good morning</p>
            <h1 className="text-base font-bold text-[#151515]">
              {user?.name || user?.email?.split('@')[0] || 'Adekunle'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Alert Toggle */}
          <button
            type="button"
            onClick={() => setAudioEnabled((prev) => !prev)}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
            aria-label="Toggle notifications"
          >
            {audioEnabled ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-gray-400" />}
            {counts.pending > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                {counts.pending}
              </span>
            ) : null}
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-700 shadow-sm">
            <User className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'border border-primary bg-white text-primary shadow-sm'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          All ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PENDING')}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'PENDING'
              ? 'border border-primary bg-white text-primary shadow-sm'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Pending ({counts.pending})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PAID')}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'PAID'
              ? 'border border-primary bg-white text-primary shadow-sm'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Paid ({counts.paid})
        </button>
      </div>

      {/* Orders List Title Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-[#151515]">Orders</h2>
        <button
          type="button"
          onClick={() => void loadOrders()}
          className="text-xs font-bold text-primary hover:underline"
        >
          See all
        </button>
      </div>

      {error ? (
        <Card className="mb-4 rounded-2xl border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </Card>
      ) : null}

      {/* Main Order Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isPaid = order.paymentStatus === 'PAID';

            return (
              <Card
                key={order.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <Link
                    href={`/operations/orders/${order.id}`}
                    className="text-xs font-bold text-[#151515] hover:text-primary sm:text-sm"
                  >
                    {order.publicCode}
                  </Link>
                  <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                    {formatTimeAgo(order.createdAt)}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold text-[#151515] sm:text-sm">
                    {formatMoney(order.totalCents, order.currency)}
                  </p>
                </div>

                <div>
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Paid
                    </span>
                  ) : isPending ? (
                    <button
                      type="button"
                      onClick={() => quickAction(order.id, 'approve')}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600 transition hover:bg-amber-100"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Pending
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600">
                      {order.status}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}

          {!filteredOrders.length ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs font-medium text-gray-400">
              No orders found for this tab.
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}

// Helpers
function upsertOrder(orders: OrderDTO[], order: OrderDTO) {
  const existing = orders.findIndex((item) => item.id === order.id);
  if (existing === -1) return [order, ...orders];
  const copy = [...orders];
  copy[existing] = order;
  return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function formatTimeAgo(dateString: string) {
  const diffInMinutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const hours = Math.floor(diffInMinutes / 60);
  return `${hours} hr${hours > 1 ? 's' : ''} ago`;
}