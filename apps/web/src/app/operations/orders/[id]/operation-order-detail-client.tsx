'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Phone } from 'lucide-react';
import type { OrderDTO, OrderStatus, PaymentStatus, RealtimeEvent } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { ElapsedTimer } from '@/components/operations/ElapsedTimer';
import { RejectOrderDialog } from '@/components/operations/RejectOrderDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, apiProxyBase, ApiError } from '@/lib/api';
import { orderBadgeVariant, orderStatusLabel, paymentBadgeVariant, paymentStatusLabel } from '@/lib/status';

const nextStatuses: OrderStatus[] = ['IN_PREPARATION', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED'];
const paymentTargets: PaymentStatus[] = ['PAID', 'FAILED', 'REFUNDED'];

export function OperationOrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ order: OrderDTO }>(`/operations/orders/${orderId}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Unable to load order.'));
  }, [orderId]);

  const publicCode = order?.publicCode;

  useEffect(() => {
    if (!publicCode) return;
    const source = new EventSource(`${apiProxyBase}/orders/${publicCode}/stream`, { withCredentials: true });
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as RealtimeEvent<OrderDTO>;
        if (event.type === 'ORDER_UPDATED' || event.type === 'PAYMENT_UPDATED') setOrder(event.payload);
      } catch {}
    };
    return () => source.close();
  }, [publicCode]);

  async function action(path: string, method: 'PATCH' = 'PATCH', body?: unknown) {
    if (!order) return;
    setLoadingAction(path);
    setError(null);
    try {
      const data = await apiFetch<{ order: OrderDTO }>(path, { method, json: body });
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setLoadingAction(null);
    }
  }

  if (error && !order) {
    return <main className="container-padded py-10"><Card className="border-red-200 bg-red-50 p-6 text-red-800">{error}</Card></main>;
  }

  if (!order) return <main className="container-padded py-10"><Card className="p-8">Loading order…</Card></main>;

  return (
    <main className="container-padded bg-primary-foreground space-y-6 py-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div >
          <Button asChild variant="ghost" className="mb-3"><Link href="/operations"><ArrowLeft className="h-4 w-4" /> Back to board</Link></Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-[var(--font-display)] text-4xl font-black text-charcoal">{order.publicCode}</h1>
            <Badge variant={orderBadgeVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
            <Badge variant={paymentBadgeVariant(order.paymentStatus)}>{paymentStatusLabel(order.paymentStatus)}</Badge>
            <ElapsedTimer startedAt={order.createdAt} />
          </div>
        </div>
        <Button className='bg-foreground' asChild variant="dark"><Link className='' href={`/operations/orders/${order.id}/print`}>
        <Printer className="h-4 w-4 " /> Print Receipt</Link></Button>
      </div>

      {error ? <Card className="border-red-200 bg-red-50 p-4 text-red-800">{error}</Card> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-black text-charcoal">Packing list</h2>
            <div className="mt-5 space-y-4">
              {order.items.map((item) => (
                <div key={item.id || item.productName} className="rounded-[1.25rem] border border-border bg-white p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-lg font-black">{item.quantity} × {item.productName}</p>
                      {item.specialInstructions ? <p className="mt-2 inline-flex rounded-xl bg-amber-100 px-3 py-2 text-sm font-black uppercase text-amber-950">{item.specialInstructions}</p> : null}
                    </div>
                    <p className="font-bold">{formatMoney(item.lineTotalCents, order.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-black text-charcoal">Status timeline</h2>
            <ol className="mt-5 space-y-3">
              {order.history?.map((entry) => (
                <li key={entry.id} className="rounded-2xl bg-white p-4 text-sm">
                  <p className="font-bold">{orderStatusLabel(entry.newStatus)} · {entry.newPaymentStatus ? paymentStatusLabel(entry.newPaymentStatus) : order.paymentStatus}</p>
                  <p className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()} {entry.actorRole ? `by ${entry.actorRole}` : ''}</p>
                  {entry.reasonCode ? <p className="mt-1 text-muted-foreground">Reason: {entry.reasonCode}</p> : null}
                  {entry.reasonNote ? <p className="mt-1 font-semibold">{entry.reasonNote}</p> : null}
                </li>
              ))}
            </ol>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-black text-charcoal">Customer context</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <Info label="Name" value={order.guestName} />
              <Info label="Email" value={order.guestEmail} />
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Phone</dt><dd className="font-bold"><a className="inline-flex items-center gap-1 text-primary" href={`tel:${order.guestPhone}`}><Phone className="h-3 w-3" />{order.guestPhone}</a></dd></div>
              <Info label="Fulfillment" value={order.fulfillmentMethod} />
              {order.deliveryArea ? <Info label="Area" value={order.deliveryArea} /> : null}
              {order.deliveryAddress ? <Info label="Address" value={order.deliveryAddress} /> : null}
              {order.deliveryInstructions ? <Info label="Instructions" value={order.deliveryInstructions} /> : null}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-black text-charcoal">Totals</h2>
            <div className="mt-5 space-y-3 text-sm">
              <Info label="Subtotal" value={formatMoney(order.subtotalCents, order.currency)} />
              <Info label="Delivery" value={formatMoney(order.deliveryFeeCents, order.currency)} />
              <div className="border-t pt-3 text-lg font-black flex justify-between"><span>Total</span><span>{formatMoney(order.totalCents, order.currency)}</span></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-black text-charcoal">Controlled actions</h2>
            <div className="mt-5 grid gap-3">
              {order.status === 'PENDING' ? <Button onClick={() => action(`/operations/orders/${order.id}/approve`)} disabled={loadingAction !== null}>Approve order</Button> : null}
              <div className="grid grid-cols-2 gap-2">
                {nextStatuses.map((status) => (
                  <Button key={status} variant="outline" disabled={loadingAction !== null || order.status === status} onClick={() => action(`/operations/orders/${order.id}/status`, 'PATCH', { status })}>{orderStatusLabel(status)}</Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {paymentTargets.map((status) => (
                  <Button key={status} variant="outline" disabled={loadingAction !== null || order.paymentStatus === status} onClick={() => action(`/operations/orders/${order.id}/payment`, 'PATCH', { paymentStatus: status })}>{paymentStatusLabel(status)}</Button>
                ))}
              </div>
              <RejectOrderDialog orderId={order.id} onUpdated={setOrder} />
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Reason for failed/cancelled actions" />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="destructive" disabled={loadingAction !== null} onClick={() => action(`/operations/orders/${order.id}/fail`, 'PATCH', { reasonCode: 'OPERATIONAL_ISSUE', reasonNote: note || 'Operational issue' })}>Mark failed</Button>
                <Button variant="outline" disabled={loadingAction !== null} onClick={() => action(`/operations/orders/${order.id}/cancel`, 'PATCH', { status: 'CANCELLED', reasonCode: 'STAFF_CANCELLED', reasonNote: note || 'Cancelled by operations' })}>Cancel</Button>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-bold">{value}</dd></div>;
}
