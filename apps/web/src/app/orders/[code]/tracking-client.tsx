'use client';

import type { ComponentType, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock3, LayoutDashboard, LogIn, PackageCheck, Truck, UserCheck, Utensils } from 'lucide-react';
import type { OrderDTO, OrderStatus, RealtimeEvent, UserDTO } from '@kob/shared-types';
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

export function OrderTrackingClient({
  publicCode,
  initialUser
}: {
  publicCode: string;
  /** Resolved on the server so the first paint is already auth-aware. */
  initialUser?: UserDTO | null;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  // undefined = session not known yet, null = checked and signed out.
  const [sessionUser, setSessionUser] = useState<UserDTO | null | undefined>(initialUser);
  const confirmed = search.get('confirmed') === '1';

  // Who is looking at this order? Signed-in customers already have a home for
  // it, so the account upsell (create account / sign in) must not be shown.
  useEffect(() => {
    let mounted = true;
    apiFetch<{ user: UserDTO | null }>('/auth/me')
      .then((data) => mounted && setSessionUser(data.user ?? null))
      // A failed re-check must not undo what the server already knew.
      .catch(() => {
        if (mounted && initialUser === undefined) setSessionUser(null);
      });
    return () => {
      mounted = false;
    };
  }, [initialUser]);

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
      const { user: createdUser } = await apiFetch<{ user: UserDTO }>('/auth/guest-account', {
        method: 'POST',
        json: {
          publicOrderCode: order.publicCode,
          email: order.guestEmail,
          fullName: order.guestName,
          phone: order.guestPhone,
          password: String(form.get('password') ?? '')
        }
      });
      // The API sets the session cookie on signup, so the page is instantly
      // "signed in" — reflect that instead of waiting for the next mount.
      setSessionUser(createdUser);
      router.push('/dashboard/orders');
    } catch (err) {
      setAccountMessage(err instanceof ApiError ? err.message : 'Unable to create account.');
    } finally {
      setIsCreatingAccount(false);
    }
  }

  return (
    <main className="container-padded bg-background py-12">
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
              <p className="font-button text-xs font-normal uppercase tracking-[0.3em] text-primary">Live order tracking</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold text-charcoal sm:text-5xl">{order.publicCode}</h1>
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
              <h2 className="text-xl font-semibold text-charcoal sm:text-2xl">Your items</h2>
              <div className="mt-5 space-y-4">
                {order.items.map((item) => (
                  <div key={`${item.productName}-${item.id}`} className="rounded-2xl border border-border/70 bg-white/70 p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-body font-medium">{item.quantity} × {item.productName}</p>
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
                <h2 className="text-xl font-semibold text-charcoal sm:text-2xl">Timeline</h2>
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
              <h2 className="text-xl font-semibold text-charcoal sm:text-2xl">Order summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Fulfillment" value={order.fulfillmentMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'} />
                {order.deliveryArea ? <Row label="Area" value={order.deliveryArea} /> : null}
                {order.deliveryAddress ? <Row label="Address" value={order.deliveryAddress} /> : null}
                <Row label="Subtotal" value={formatMoney(order.subtotalCents, order.currency)} />
                <Row label="Delivery fee" value={formatMoney(order.deliveryFeeCents, order.currency)} />
                <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold"><span>Total</span><span>{formatMoney(order.totalCents, order.currency)}</span></div>
              </div>
            </Card>

            {sessionUser === undefined ? (
              <Card className="glass-card p-6">
                <p className="text-sm text-muted-foreground">Checking your account…</p>
              </Card>
            ) : sessionUser ? (
              <Card className="glass-card p-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 font-button text-xs font-normal text-emerald-800">
                  <UserCheck className="h-3.5 w-3.5" /> Signed in
                </span>
                <h2 className="mt-3 text-xl font-semibold text-charcoal sm:text-2xl">You&rsquo;re signed in as {sessionUser.fullName}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This order lives in your account history. No need to create another account — track it here or pick it
                  back up from your dashboard.
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button asChild><Link href="/dashboard/orders"><LayoutDashboard className="h-4 w-4" /> My orders</Link></Button>
                  <Button asChild variant="outline"><Link href="/menu">Order again</Link></Button>
                </div>
              </Card>
            ) : (
              <Card className="glass-card p-6">
                <h2 className="text-xl font-semibold text-charcoal sm:text-2xl">Save your details</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Create an account with one password to link this order and load your personal dashboard. Historical matching continues safely in the background.</p>
                <form onSubmit={createAccount} className="mt-5 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" minLength={8} required placeholder="At least 8 characters" />
                  </div>
                  <Button type="submit" disabled={isCreatingAccount} className="w-full">{isCreatingAccount ? 'Creating…' : 'Create account'}</Button>
                </form>
                {accountMessage ? <p className="mt-3 text-sm font-medium text-red-700">{accountMessage}</p> : null}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Button asChild variant="outline"><Link href="/login"><LogIn className="h-4 w-4" /> Sign in</Link></Button>
                  <Button asChild variant="ghost"><Link href="/dashboard/orders">I already have an account</Link></Button>
                </div>
              </Card>
            )}
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold">{value}</span></div>;
}
