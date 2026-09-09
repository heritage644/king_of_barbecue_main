import { z } from 'zod';

export const USER_ROLES = [
  'CUSTOMER',
  'CASHIER',
  'OPERATIONS_STAFF',
  'MANAGER',
  'OWNER',
  'SUPPLIER',
  'INVENTORY_STAFF',
  'KITCHEN_STAFF',
  'LOGISTICS',
  'DELIVERY_PARTNER',
  'ADMIN'
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const CUSTOMER_ROLE: UserRole = 'CUSTOMER';
export const OPERATION_ROLES = ['CASHIER', 'OPERATIONS_STAFF', 'MANAGER', 'OWNER', 'ADMIN'] as const satisfies readonly UserRole[];
export const PAYMENT_MANAGEMENT_ROLES = ['CASHIER', 'MANAGER', 'OWNER', 'ADMIN'] as const satisfies readonly UserRole[];
export const STORE_CONTROL_ROLES = ['CASHIER', 'OPERATIONS_STAFF', 'MANAGER', 'OWNER', 'ADMIN'] as const satisfies readonly UserRole[];
export const STAFF_AND_ADMIN_ROLES = [
  'CASHIER',
  'OPERATIONS_STAFF',
  'MANAGER',
  'OWNER',
  'INVENTORY_STAFF',
  'KITCHEN_STAFF',
  'LOGISTICS',
  'ADMIN'
] as const satisfies readonly UserRole[];

export const ORDER_STATUSES = [
  'PENDING',
  'APPROVED',
  'IN_PREPARATION',
  'READY',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'REJECTED',
  'FAILED',
  'CANCELLED'
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ACTIVE_ORDER_STATUSES = ['PENDING', 'APPROVED', 'IN_PREPARATION', 'READY', 'OUT_FOR_DELIVERY'] as const satisfies readonly OrderStatus[];
export const TERMINAL_ORDER_STATUSES = ['COMPLETED', 'REJECTED', 'FAILED', 'CANCELLED'] as const satisfies readonly OrderStatus[];

export const PAYMENT_STATUSES = ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CASH_ON_DELIVERY'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const FULFILLMENT_METHODS = ['PICKUP', 'DELIVERY'] as const;
export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number];

export const PAYMENT_METHODS = ['MANUAL_TRANSFER', 'CASH_ON_DELIVERY'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const REJECTION_REASON_CODES = [
  'ITEM_OUT_OF_STOCK',
  'DELIVERY_ZONE_UNAVAILABLE',
  'SUSPICIOUS_ACTIVITY',
  'RESTAURANT_CAPACITY',
  'OTHER'
] as const;
export type RejectionReasonCode = (typeof REJECTION_REASON_CODES)[number];

export const FAILURE_REASON_CODES = [
  'CUSTOMER_UNREACHABLE',
  'DRIVER_UNABLE_TO_REACH_CUSTOMER',
  'PAYMENT_FAILED',
  'OPERATIONAL_ISSUE',
  'OTHER'
] as const;
export type FailureReasonCode = (typeof FAILURE_REASON_CODES)[number];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED', 'CANCELLED', 'FAILED'],
  APPROVED: ['IN_PREPARATION', 'READY', 'CANCELLED', 'FAILED'],
  IN_PREPARATION: ['READY', 'CANCELLED', 'FAILED'],
  READY: ['OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED', 'FAILED'],
  OUT_FOR_DELIVERY: ['COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: [],
  REJECTED: [],
  FAILED: [],
  CANCELLED: []
};

export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  UNPAID: ['PENDING', 'PAID', 'FAILED', 'CASH_ON_DELIVERY'],
  PENDING: ['PAID', 'FAILED', 'REFUNDED', 'CASH_ON_DELIVERY'],
  CASH_ON_DELIVERY: ['PAID', 'FAILED', 'REFUNDED'],
  PAID: ['REFUNDED'],
  FAILED: ['UNPAID', 'PENDING'],
  REFUNDED: []
};

export function isValidOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return (TERMINAL_ORDER_STATUSES as readonly OrderStatus[]).includes(status);
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return (ACTIVE_ORDER_STATUSES as readonly OrderStatus[]).includes(status);
}

export function isValidPaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_STATUS_TRANSITIONS[from].includes(to);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s().-]/g, '').trim();
}

export function canRoleAccess(userRoles: readonly UserRole[] | undefined, allowedRoles: readonly UserRole[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function formatMoney(cents: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(cents / 100);
}

export function calculateLineTotal(unitPriceCents: number, quantity: number): number {
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
    throw new Error('Unit price must be a non-negative integer number of cents.');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a positive integer.');
  }
  return unitPriceCents * quantity;
}

export interface PricedOrderItemInput {
  unitPriceCents: number;
  quantity: number;
}

export function calculateOrderTotals(items: readonly PricedOrderItemInput[], deliveryFeeCents = 0) {
  const subtotalCents = items.reduce((total, item) => total + calculateLineTotal(item.unitPriceCents, item.quantity), 0);
  if (!Number.isInteger(deliveryFeeCents) || deliveryFeeCents < 0) {
    throw new Error('Delivery fee must be a non-negative integer number of cents.');
  }
  return {
    subtotalCents,
    deliveryFeeCents,
    totalCents: subtotalCents + deliveryFeeCents
  };
}

export const userRoleSchema = z.enum(USER_ROLES);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const fulfillmentMethodSchema = z.enum(FULFILLMENT_METHODS);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export const rejectionReasonCodeSchema = z.enum(REJECTION_REASON_CODES);
export const failureReasonCodeSchema = z.enum(FAILURE_REASON_CODES);

export const uuidSchema = z.string().uuid();
export const publicOrderCodeSchema = z.string().trim().min(5).max(40).regex(/^ORD-[A-Z0-9-]+$/i, 'Invalid order code.');

export const loginSchema = z.object({
  email: z.string().email().transform(normalizeEmail),
  password: z.string().min(8).max(200)
});

export const addCartItemSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().int().min(1).max(50).default(1),
  specialInstructions: z.string().trim().max(500).optional().nullable()
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(50),
  specialInstructions: z.string().trim().max(500).optional().nullable()
});

export const checkoutSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().email().transform(normalizeEmail),
    phone: z.string().trim().min(7).max(30).transform(normalizePhone),
    fulfillmentMethod: fulfillmentMethodSchema,
    deliveryAddress: z.string().trim().max(500).optional().nullable(),
    deliveryArea: z.string().trim().max(120).optional().nullable(),
    deliveryInstructions: z.string().trim().max(500).optional().nullable(),
    paymentMethod: paymentMethodSchema.default('MANUAL_TRANSFER'),
    idempotencyKey: z.string().trim().min(8).max(120).optional()
  })
  .superRefine((value, context) => {
    if (value.fulfillmentMethod === 'DELIVERY') {
      if (!value.deliveryAddress || value.deliveryAddress.trim().length < 5) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['deliveryAddress'], message: 'Delivery address is required.' });
      }
      if (!value.deliveryArea || value.deliveryArea.trim().length < 2) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['deliveryArea'], message: 'Delivery area is required.' });
      }
    }
  });

export const createAccountFromGuestSchema = z.object({
  publicOrderCode: publicOrderCodeSchema,
  email: z.string().email().transform(normalizeEmail),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(30).transform(normalizePhone).optional(),
  password: z.string().min(8).max(200)
});

export const rejectOrderSchema = z.object({
  reasonCode: rejectionReasonCodeSchema,
  reasonNote: z.string().trim().max(800).optional().nullable()
});

export const failOrderSchema = z.object({
  reasonCode: failureReasonCodeSchema,
  reasonNote: z.string().trim().max(800).optional().nullable()
});

export const statusUpdateSchema = z.object({
  status: orderStatusSchema,
  reasonCode: z.string().trim().max(80).optional().nullable(),
  reasonNote: z.string().trim().max(800).optional().nullable()
});

export const paymentUpdateSchema = z.object({
  paymentStatus: paymentStatusSchema,
  reasonNote: z.string().trim().max(800).optional().nullable()
});

export const storePauseSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable()
});

export const orderListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  fulfillmentMethod: fulfillmentMethodSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null | undefined;
  roles: UserRole[];
  createdAt: string;
}

export interface ProductCategoryDTO {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder: number;
}

export interface ProductDTO {
  id: string;
  categoryId: string;
  categoryName?: string | undefined;
  slug: string;
  name: string;
  description: string;
  imageUrl?: string | null | undefined;
  priceCents: number;
  currency: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface CartItemDTO {
  productId: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null | undefined;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  currency: string;
  isAvailable: boolean;
  specialInstructions?: string | null | undefined;
}

export interface CartDTO {
  id: string;
  items: CartItemDTO[];
  subtotalCents: number;
  currency: string;
  expiresAt?: string;
}

export interface OrderItemDTO {
  id: string;
  productId?: string | null;
  productName: string;
  productSnapshot: Record<string, unknown>;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  specialInstructions?: string | null | undefined;
}

export interface PaymentDTO {
  id: string;
  orderId: string;
  status: PaymentStatus;
  method: string;
  provider?: string | null | undefined;
  providerReference?: string | null | undefined;
  amountCents: number;
  currency: string;
  verifiedAt?: string | null | undefined;
}

export interface OrderStatusHistoryDTO {
  id: string;
  previousStatus?: OrderStatus | null | undefined;
  newStatus: OrderStatus;
  previousPaymentStatus?: PaymentStatus | null | undefined;
  newPaymentStatus?: PaymentStatus | null | undefined;
  actorUserId?: string | null | undefined;
  actorRole?: string | null | undefined;
  reasonCode?: string | null | undefined;
  reasonNote?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
  createdAt: string;
}

export interface OrderDTO {
  id: string;
  publicCode: string;
  userId?: string | null | undefined;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress?: string | null | undefined;
  deliveryArea?: string | null | undefined;
  deliveryInstructions?: string | null | undefined;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  currency: string;
  rejectionReason?: string | null | undefined;
  failureReason?: string | null | undefined;
  cancellationReason?: string | null | undefined;
  placedAt: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
  payments?: PaymentDTO[] | undefined;
  history?: OrderStatusHistoryDTO[] | undefined;
}

export interface StoreSettingsDTO {
  isPaused: boolean;
  pauseReason?: string | null | undefined;
  updatedAt: string;
}

export const QUEUE_NAMES = {
  guestAccountLinking: 'guest-account-linking',
  email: 'email',
  notifications: 'notifications',
  analytics: 'analytics'
} as const;

export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'PAYMENT_UPDATED'
  | 'STORE_UPDATED'
  | 'NOTIFICATION';

export interface RealtimeEvent<TPayload = unknown> {
  id: string;
  type: RealtimeEventType;
  topic: string;
  payload: TPayload;
  occurredAt: string;
}
