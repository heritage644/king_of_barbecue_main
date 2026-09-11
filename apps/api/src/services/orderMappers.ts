import type { OrderDTO, OrderItemDTO, OrderStatusHistoryDTO, PaymentDTO } from '@kob/shared-types';

export function mapOrderItem(row: Record<string, unknown>): OrderItemDTO {
  return {
    id: String(row.id),
    productId: row.product_id ? String(row.product_id) : null,
    productName: String(row.product_name),
    productSnapshot: (row.product_snapshot as Record<string, unknown>) ?? {},
    unitPriceCents: Number(row.unit_price_cents),
    quantity: Number(row.quantity),
    lineTotalCents: Number(row.line_total_cents),
    specialInstructions: row.special_instructions ? String(row.special_instructions) : null
  };
}

export function mapPayment(row: Record<string, unknown>): PaymentDTO {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    status: row.status as PaymentDTO['status'],
    method: String(row.method),
    provider: row.provider ? String(row.provider) : null,
    providerReference: row.provider_reference ? String(row.provider_reference) : null,
    amountCents: Number(row.amount_cents),
    currency: String(row.currency),
    verifiedAt: row.verified_at ? new Date(String(row.verified_at)).toISOString() : null
  };
}

export function mapHistory(row: Record<string, unknown>): OrderStatusHistoryDTO {
  return {
    id: String(row.id),
    previousStatus: (row.previous_status as OrderStatusHistoryDTO['previousStatus']) ?? null,
    newStatus: row.new_status as OrderStatusHistoryDTO['newStatus'],
    previousPaymentStatus: (row.previous_payment_status as OrderStatusHistoryDTO['previousPaymentStatus']) ?? null,
    newPaymentStatus: (row.new_payment_status as OrderStatusHistoryDTO['newPaymentStatus']) ?? null,
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    actorRole: row.actor_role ? String(row.actor_role) : null,
    reasonCode: row.reason_code ? String(row.reason_code) : null,
    reasonNote: row.reason_note ? String(row.reason_note) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

export function mapOrder(row: Record<string, unknown>, related?: { items?: OrderItemDTO[]; payments?: PaymentDTO[]; history?: OrderStatusHistoryDTO[] }): OrderDTO {
  return {
    id: String(row.id),
    publicCode: String(row.public_code),
    userId: row.user_id ? String(row.user_id) : null,
    guestName: String(row.guest_name),
    guestEmail: String(row.guest_email),
    guestPhone: String(row.guest_phone),
    fulfillmentMethod: row.fulfillment_method as OrderDTO['fulfillmentMethod'],
    deliveryAddress: row.delivery_address ? String(row.delivery_address) : null,
    deliveryArea: row.delivery_area ? String(row.delivery_area) : null,
    deliveryInstructions: row.delivery_instructions ? String(row.delivery_instructions) : null,
    status: row.status as OrderDTO['status'],
    paymentStatus: row.payment_status as OrderDTO['paymentStatus'],
    subtotalCents: Number(row.subtotal_cents),
    deliveryFeeCents: Number(row.delivery_fee_cents),
    totalCents: Number(row.total_cents),
    currency: String(row.currency),
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : null,
    failureReason: row.failure_reason ? String(row.failure_reason) : null,
    cancellationReason: row.cancellation_reason ? String(row.cancellation_reason) : null,
    placedAt: new Date(String(row.placed_at)).toISOString(),
    resolvedAt: row.resolved_at ? new Date(String(row.resolved_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    items: related?.items ?? [],
    payments: related?.payments,
    history: related?.history
  };
}
