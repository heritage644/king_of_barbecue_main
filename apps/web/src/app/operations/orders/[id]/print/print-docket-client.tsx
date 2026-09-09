'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrderDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Button } from '@/components/ui/button';
import { apiFetch, ApiError } from '@/lib/api';
import { orderStatusLabel, paymentStatusLabel } from '@/lib/status';

export function PrintDocketClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ order: OrderDTO }>(`/operations/orders/${orderId}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Unable to load order.'));
  }, [orderId]);

  return (
    <main className="mx-auto max-w-sm bg-white p-4 text-black receipt-print">
      <div className="no-print mb-4 flex gap-2">
        <Button onClick={() => window.print()}>Print</Button>
        <Button asChild variant="outline"><Link href={`/operations/orders/${orderId}`}>Back</Link></Button>
      </div>
      {error ? <p className="text-red-700">{error}</p> : null}
      {!order ? <p>Loading docket…</p> : (
        <article>
          <div className="text-center">
            <h1 className="text-xl font-black">KING OF BARBECUE</h1>
            <p>Kitchen Docket / Receipt</p>
            <p>{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <hr className="my-3 border-black" />
          <p><strong>Order:</strong> {order.publicCode}</p>
          <p><strong>Status:</strong> {orderStatusLabel(order.status)}</p>
          <p><strong>Payment:</strong> {paymentStatusLabel(order.paymentStatus)}</p>
          <p><strong>Customer:</strong> {order.guestName}</p>
          <p><strong>Phone:</strong> {order.guestPhone}</p>
          <p><strong>Fulfillment:</strong> {order.fulfillmentMethod}</p>
          {order.deliveryAddress ? <p><strong>Address:</strong> {order.deliveryAddress}</p> : null}
          {order.deliveryInstructions ? <p><strong>Delivery note:</strong> {order.deliveryInstructions}</p> : null}
          <hr className="my-3 border-black" />
          {order.items.map((item) => (
            <div key={item.id || item.productName} className="mb-3">
              <div className="flex justify-between gap-2">
                <strong>{item.quantity} x {item.productName}</strong>
                <span>{formatMoney(item.lineTotalCents, order.currency)}</span>
              </div>
              {item.specialInstructions ? <p className="text-lg font-black uppercase">*** {item.specialInstructions} ***</p> : null}
            </div>
          ))}
          <hr className="my-3 border-black" />
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotalCents, order.currency)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{formatMoney(order.deliveryFeeCents, order.currency)}</span></div>
          <div className="flex justify-between text-lg font-black"><span>Total</span><span>{formatMoney(order.totalCents, order.currency)}</span></div>
          <p className="mt-5 text-center text-xs">Printed from browser. Future POS/thermal printer adapters can consume this same order model.</p>
        </article>
      )}
    </main>
  );
}
