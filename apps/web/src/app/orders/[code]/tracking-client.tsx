'use client';

import type { ComponentType, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock3, PackageCheck, Truck, Utensils } from 'lucide-react';
import type { OrderDTO, OrderStatus, RealtimeEvent } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, apiProxyBase, ApiError } from '@/lib/api';
import { orderBadgeVariant, orderStatusLabel, paymentBadgeVariant, paymentStatusLabel } from '@/lib/status';

const steps: { label: string; statuses: OrderStatus[]; icon: ComponentType<{ className?: string }> }[] = [
  { label: 'Order received', statuses: ['PENDING'], icon: Clock3 },
  { label: 'Approved', statuses: ['APPROVED'], icon: CheckCircle2 },
  { label: 'In preparation', statuses: ['IN_PREPARATION'], icon: Utensils },
  { label: 'Ready / out', statuses: ['READY', 'OUT_FOR_DELIVERY'], icon: Truck },
  { label: 'Completed', statuses: ['COMPLETED'], icon: PackageCheck }
];

export function OrderTrackingClient({ publicCode }: { publicCode: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const confirmed = search.get('confirmed') === '1';

  useEffect(() => {
    let mounted = true;
    apiFetch<{ order: OrderDTO }>(`/orders/${publicCode}`)
      .then((data) => {
        if (mounted) setOrder(data.order);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Unable to load this order.'));

    const source = new EventSource(`${apiProxyBase}/orders/${publicCode}/stream`, { withCredentials: true });
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as RealtimeEvent<OrderDTO>;
        if (event.type === 'ORDER_UPDATED' || event.type === 'PAYMENT_UPDATED' || event.type === 'ORDER_CREATED') {
          setOrder(event.payload);
        }
      } catch {
        // Ignore malformed SSE data.
      }
    };
    source.onerror = () => {
      // Browser will retry automatically; keep existing UI state.
    };

    return () => {
      mounted = false;
      source.close();
    };
  }, [publicCode]);

  const activeStep = useMemo(() => {
    if (!order) return 0;
    const index = steps.findIndex((step) => step.statuses.includes(order.status));
    return index === -1 ? 0 : index;
  }, [order]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
    setIsCreatingAccount(true);
    setAccountMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch('/auth/guest-account', {
        method: 'POST',
        json: {
          publicOrderCode: order.publicCode,
          email: order.guestEmail,
          fullName: order.guestName,
          phone: order.guestPhone,
          password: String(form.get('password') ?? '')
        }
      });
      router.push('/dashboard/orders');
    } catch (err) {
      setAccountMessage(err instanceof ApiError ? err.message : 'Unable to create account.');
    } finally {
      setIsCreatingAccount(false);
    }
  }

  return (
    <main className="container-padded py-12">
      {confirmed ? (
        <Card className="mb-6 border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-900">
          Order placed successfully. Keep this page open for live updates.
        </Card>
      ) : null}
      {error ? <Card className="border-red-200 bg-red-50 p-6 text-red-800">{error}</Card> : null}
      {!order && !error ? <Card className="glass-card p-8">Loading order tracking…</Card> : null}

      {order ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Live order tracking</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-[var(--font-display)] text-5xl font-black text-charcoal">{order.publicCode}</h1>
                <Badge variant={orderBadgeVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
                <Badge variant={paymentBadgeVariant(order.paymentStatus)}>{paymentStatusLabel(order.paymentStatus)}</Badge>
              </div>
              <p className="text-muted-foreground">Updates arrive instantly through Server-Sent Events — no refresh required.</p>
            </div>

            <Card className="glass-card p-6">
              <div className="grid gap-4 md:grid-cols-5">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isComplete = index <= activeStep && !['REJECTED', 'FAILED', 'CANCELLED'].includes(order.status);
                  return (
                    <div key={step.label} className="flex items-center gap-3 md:block">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full border ${isComplete ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white text-muted-foreground'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className={`mt-0 text-sm font-bold md:mt-3 ${isComplete ? 'text-charcoal' : 'text-muted-foreground'}`}>{step.label}</p>
                    </div>
                  );
                })}
              </div>
              {order.rejectionReason || order.failureReason || order.cancellationReason ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
                  {order.rejectionReason || order.failureReason || order.cancellationReason}
                </div>
              ) : null}
            </Card>

            <Card className="glass-card p-6">
              <h2 className="text-2xl font-black text-charcoal">Your items</h2>
              <div className="mt-5 space-y-4">
                {order.items.map((item) => (
                  <div key={`${item.productName}-${item.id}`} className="rounded-2xl border border-border/70 bg-white/70 p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-black">{item.quantity} × {item.productName}</p>
                        {item.specialInstructions ? <p className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-950">{item.specialInstructions}</p> : null}
                      </div>
                      <p className="font-bold">{formatMoney(item.lineTotalCents, order.currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {order.history?.length ? (
              <Card className="glass-card p-6">
                <h2 className="text-2xl font-black text-charcoal">Timeline</h2>
                <ol className="mt-5 space-y-3">
                  {order.history.map((entry) => (
                    <li key={entry.id} className="rounded-2xl border border-border/70 bg-white/70 p-4 text-sm">
                      <p className="font-bold">{orderStatusLabel(entry.newStatus)} {entry.newPaymentStatus ? `· ${paymentStatusLabel(entry.newPaymentStatus)}` : ''}</p>
                      <p className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                      {entry.reasonNote ? <p className="mt-1 text-muted-foreground">{entry.reasonNote}</p> : null}
                    </li>
                  ))}
                </ol>
              </Card>
            ) : null}
          </section>

          <aside className="space-y-6">
            <Card className="glass-card p-6">
              <h2 className="text-2xl font-black text-charcoal">Order summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Fulfillment" value={order.fulfillmentMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'} />
                {order.deliveryArea ? <Row label="Area" value={order.deliveryArea} /> : null}
                {order.deliveryAddress ? <Row label="Address" value={order.deliveryAddress} /> : null}
                <Row label="Subtotal" value={formatMoney(order.subtotalCents, order.currency)} />
                <Row label="Delivery fee" value={formatMoney(order.deliveryFeeCents, order.currency)} />
                <div className="border-t border-border pt-3 text-lg font-black flex justify-between"><span>Total</span><span>{formatMoney(order.totalCents, order.currency)}</span></div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <h2 className="text-2xl font-black text-charcoal">Save your details</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Create an account with one password to link this order and load your personal dashboard. Historical matching continues safely in the background.</p>
              <form onSubmit={createAccount} className="mt-5 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" minLength={8} required placeholder="At least 8 characters" />
                </div>
                <Button type="submit" disabled={isCreatingAccount} className="w-full">{isCreatingAccount ? 'Creating…' : 'Create account'}</Button>
              </form>
              {accountMessage ? <p className="mt-3 text-sm font-semibold text-red-700">{accountMessage}</p> : null}
              <Button asChild variant="ghost" className="mt-2 w-full"><Link href="/dashboard/orders">I already have an account</Link></Button>
            </Card>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold">{value}</span></div>;
}
