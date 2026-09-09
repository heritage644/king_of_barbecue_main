import type { OrderStatus, PaymentStatus } from '@kob/shared-types';

export function orderStatusLabel(status: OrderStatus) {
  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function paymentStatusLabel(status: PaymentStatus) {
  return orderStatusLabel(status as unknown as OrderStatus);
}

export function orderBadgeVariant(status: OrderStatus) {
  if (status === 'COMPLETED') return 'success' as const;
  if (['REJECTED', 'FAILED', 'CANCELLED'].includes(status)) return 'danger' as const;
  if (status === 'PENDING') return 'pending' as const;
  return 'progress' as const;
}

export function paymentBadgeVariant(status: PaymentStatus) {
  if (status === 'PAID') return 'success' as const;
  if (['FAILED', 'REFUNDED'].includes(status)) return 'danger' as const;
  if (status === 'UNPAID' || status === 'PENDING' || status === 'CASH_ON_DELIVERY') return 'pending' as const;
  return 'neutral' as const;
}

export function activeMinutesSince(isoDate: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 60_000));
}

export function timerTone(minutes: number) {
  if (minutes >= 20) return 'text-red-700 bg-red-100 border-red-200';
  if (minutes >= 10) return 'text-amber-900 bg-amber-100 border-amber-200';
  return 'text-emerald-900 bg-emerald-100 border-emerald-200';
}
