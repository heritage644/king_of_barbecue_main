'use client';

import { useState } from 'react';
import { REJECTION_REASON_CODES, type OrderDTO } from '@kob/shared-types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, ApiError } from '@/lib/api';

const reasonLabels: Record<(typeof REJECTION_REASON_CODES)[number], string> = {
  ITEM_OUT_OF_STOCK: 'Item out of stock',
  DELIVERY_ZONE_UNAVAILABLE: 'Delivery zone unavailable',
  SUSPICIOUS_ACTIVITY: 'Suspicious activity',
  RESTAURANT_CAPACITY: 'Restaurant capacity',
  OTHER: 'Other'
};

export function RejectOrderDialog({ orderId, onUpdated }: { orderId: string; onUpdated: (order: OrderDTO) => void }) {
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<(typeof REJECTION_REASON_CODES)[number]>('ITEM_OUT_OF_STOCK');
  const [reasonNote, setReasonNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reject() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ order: OrderDTO }>(`/operations/orders/${orderId}/reject`, {
        method: 'PATCH',
        json: { reasonCode, reasonNote: reasonNote || undefined }
      });
      onUpdated(data.order);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to reject order.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="destructive">Reject</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject order</DialogTitle>
          <DialogDescription>Choose a structured reason. This is saved to the order history and shown where appropriate.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reasonCode">Reason</Label>
            <select
              id="reasonCode"
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value as typeof reasonCode)}
              className="h-11 w-full rounded-2xl border border-input bg-white/80 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {REJECTION_REASON_CODES.map((code) => <option key={code} value={code}>{reasonLabels[code]}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reasonNote">Additional note</Label>
            <Textarea id="reasonNote" value={reasonNote} onChange={(event) => setReasonNote(event.target.value)} placeholder="Optional details for the customer and audit trail" />
          </div>
          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={reject} disabled={loading}>{loading ? 'Rejecting…' : 'Reject order'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
