import type pg from 'pg';
import {
  calculateLineTotal,
  calculateOrderTotals,
  canRoleAccess,
  normalizeEmail,
  normalizePhone,
  OPERATION_ROLES,
  PAYMENT_MANAGEMENT_ROLES,
  type FulfillmentMethod,
  type OrderDTO,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  type UserRole
} from '@kob/shared-types';
import { isValidOrderTransition, isValidPaymentTransition } from '@kob/shared-types';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import { AppError } from '../errors/AppError.js';
import { analyticsQueue, emailQueue, notificationQueue } from '../infra/queues.js';
import { redis } from '../infra/redis.js';
import { logger } from '../infra/logger.js';
import { publishRealtimeEvent, realtimeTopics } from '../realtime/eventBus.js';
import { cartService, type RedisCartItem } from './CartService.js';
import { mapHistory, mapOrder, mapOrderItem, mapPayment } from './orderMappers.js';
import { generatePublicOrderCode, generateTrackingToken, hashToken } from '../utils/security.js';

interface Actor {
  id: string;
  email: string;
  roles: UserRole[];
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  price_cents: number;
  currency: string;
  is_available: boolean;
  category_name: string;
}

function idempotencyKey(email: string, key: string) {
  return `order-idempotency:${email}:${key}`;
}

function actorRole(actor?: Actor) {
  return actor?.roles.find((role) => role !== 'CUSTOMER') ?? actor?.roles[0] ?? null;
}

export class OrderService {
  async createOrderFromCart(
    cartId: string,
    input: {
      fullName: string;
      email: string;
      phone: string;
      fulfillmentMethod: FulfillmentMethod;
      deliveryAddress?: string | null;
      deliveryArea?: string | null;
      deliveryInstructions?: string | null;
      paymentMethod: PaymentMethod;
      idempotencyKey?: string;
    }
  ): Promise<{ order: OrderDTO; trackingToken: string }> {
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);

    if (input.idempotencyKey) {
      const cached = await redis.get(idempotencyKey(email, input.idempotencyKey));
      if (cached) {
        const parsed = JSON.parse(cached) as { publicCode: string; trackingToken: string };
        return { order: await this.getOrderDetailByRef(parsed.publicCode), trackingToken: parsed.trackingToken };
      }
    }

    const cart = await cartService.getRawCart(cartId);
    if (cart.items.length === 0) throw AppError.validation('Your cart is empty.');

    const trackingToken = generateTrackingToken();
    const tokenHash = hashToken(trackingToken);

    const order = await withTransaction(async (client) => {
      const store = await client.query('SELECT is_paused, pause_reason FROM store_settings WHERE id = 1 FOR UPDATE');
      if (store.rows[0]?.is_paused) {
        throw new AppError(409, 'STORE_PAUSED', store.rows[0].pause_reason ?? 'Services are temporarily on hold.');
      }

      const productRows = await this.getProductsForCart(client, cart.items);
      const orderedItems = cart.items.map((cartItem) => {
        const product = productRows.get(cartItem.productId);
        if (!product) throw AppError.validation('One or more cart items no longer exist.');
        if (!product.is_available) throw AppError.conflict(`${product.name} is currently unavailable.`);
        const lineTotalCents = calculateLineTotal(Number(product.price_cents), cartItem.quantity);
        return { cartItem, product, lineTotalCents };
      });

      const { subtotalCents, deliveryFeeCents, totalCents } = calculateOrderTotals(
        orderedItems.map((item) => ({ unitPriceCents: Number(item.product.price_cents), quantity: item.cartItem.quantity })),
        0
      );
      const paymentStatus: PaymentStatus = input.paymentMethod === 'CASH_ON_DELIVERY' ? 'CASH_ON_DELIVERY' : 'UNPAID';
      const publicCode = await this.createUniquePublicCode(client);

      const orderResult = await client.query(
        `INSERT INTO orders (
          public_code, guest_name, guest_email, guest_phone, fulfillment_method,
          delivery_address, delivery_area, delivery_instructions, status, payment_status,
          subtotal_cents, delivery_fee_cents, total_cents, currency, idempotency_key, cart_id, tracking_token_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10, $11, $12, 'NGN', $13, $14, $15)
        RETURNING *`,
        [
          publicCode,
          input.fullName,
          email,
          phone,
          input.fulfillmentMethod,
          input.deliveryAddress ?? null,
          input.deliveryArea ?? null,
          input.deliveryInstructions ?? null,
          paymentStatus,
          subtotalCents,
          deliveryFeeCents,
          totalCents,
          input.idempotencyKey ?? null,
          cartId,
          tokenHash
        ]
      );
      const orderRow = orderResult.rows[0];

      for (const item of orderedItems) {
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, product_snapshot, unit_price_cents, quantity, line_total_cents, special_instructions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            orderRow.id,
            item.product.id,
            item.product.name,
            {
              id: item.product.id,
              slug: item.product.slug,
              name: item.product.name,
              description: item.product.description,
              imageUrl: item.product.image_url,
              categoryName: item.product.category_name,
              priceCents: Number(item.product.price_cents),
              currency: item.product.currency
            },
            Number(item.product.price_cents),
            item.cartItem.quantity,
            item.lineTotalCents,
            item.cartItem.specialInstructions ?? null
          ]
        );
      }

      await client.query(
        `INSERT INTO payments (order_id, status, method, amount_cents, currency)
         VALUES ($1, $2, $3, $4, 'NGN')`,
        [orderRow.id, paymentStatus, input.paymentMethod, totalCents]
      );

      await this.insertHistory(client, {
        orderId: orderRow.id,
        previousStatus: null,
        newStatus: 'PENDING',
        previousPaymentStatus: null,
        newPaymentStatus: paymentStatus,
        actorUserId: null,
        actorRole: null,
        reasonCode: 'ORDER_CREATED',
        reasonNote: null,
        metadata: { source: 'guest_checkout' }
      });

      return mapOrder(orderRow, {
        items: orderedItems.map((item) => ({
          id: '',
          productId: item.product.id,
          productName: item.product.name,
          productSnapshot: {
            slug: item.product.slug,
            imageUrl: item.product.image_url,
            categoryName: item.product.category_name
          },
          unitPriceCents: Number(item.product.price_cents),
          quantity: item.cartItem.quantity,
          lineTotalCents: item.lineTotalCents,
          specialInstructions: item.cartItem.specialInstructions ?? null
        }))
      });
    });

    await cartService.clearCart(cartId);
    if (input.idempotencyKey) {
      await redis.set(idempotencyKey(email, input.idempotencyKey), JSON.stringify({ publicCode: order.publicCode, trackingToken }), 'EX', 24 * 60 * 60);
    }

    const fullOrder = await this.getOrderDetailByRef(order.publicCode);
    await this.afterOrderMutation(fullOrder, 'ORDER_CREATED');
    return { order: fullOrder, trackingToken };
  }

  async getOrderForCustomer(publicCode: string, actor?: Actor, trackingToken?: string): Promise<OrderDTO> {
    const order = await this.getOrderDetailByRef(publicCode, true);
    const raw = await pool.query('SELECT tracking_token_hash FROM orders WHERE id = $1', [order.id]);
    const tokenHash = trackingToken ? hashToken(trackingToken) : undefined;

    if (actor && (canRoleAccess(actor.roles, OPERATION_ROLES) || order.userId === actor.id)) return order;
    if (tokenHash && raw.rows[0]?.tracking_token_hash === tokenHash) return order;

    throw AppError.forbidden('You are not allowed to access this order.');
  }

  async listOrdersForUser(userId: string): Promise<OrderDTO[]> {
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return this.hydrateOrderRows(result.rows, false);
  }

  async listOperationsOrders(filters: {
    q?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    fulfillmentMethod?: FulfillmentMethod;
    from?: string;
    to?: string;
    limit: number;
    offset: number;
  }): Promise<{ orders: OrderDTO[]; total: number }> {
    const params: unknown[] = [];
    const where: string[] = [];

    if (filters.status) {
      params.push(filters.status);
      where.push(`status = $${params.length}`);
    }
    if (filters.paymentStatus) {
      params.push(filters.paymentStatus);
      where.push(`payment_status = $${params.length}`);
    }
    if (filters.fulfillmentMethod) {
      params.push(filters.fulfillmentMethod);
      where.push(`fulfillment_method = $${params.length}`);
    }
    if (filters.from) {
      params.push(filters.from);
      where.push(`created_at >= $${params.length}`);
    }
    if (filters.to) {
      params.push(filters.to);
      where.push(`created_at <= $${params.length}`);
    }
    if (filters.q) {
      params.push(`%${filters.q.toLowerCase()}%`);
      where.push(`(lower(public_code) LIKE $${params.length} OR lower(guest_name) LIKE $${params.length} OR lower(guest_phone) LIKE $${params.length})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const totalResult = await pool.query(`SELECT count(*)::int AS count FROM orders ${whereSql}`, params);

    params.push(filters.limit, filters.offset);
    const result = await pool.query(
      `SELECT * FROM orders ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const orders = await this.hydrateOrderRows(result.rows, false);
    return { orders, total: Number(totalResult.rows[0]?.count ?? 0) };
  }

  private async hydrateOrderRows(rows: Record<string, unknown>[], includeHistory: boolean): Promise<OrderDTO[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    const [itemsResult, paymentsResult, historyResult] = await Promise.all([
      pool.query('SELECT * FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY created_at ASC', [ids]),
      pool.query('SELECT * FROM payments WHERE order_id = ANY($1::uuid[]) ORDER BY created_at ASC', [ids]),
      includeHistory
        ? pool.query('SELECT * FROM order_status_history WHERE order_id = ANY($1::uuid[]) ORDER BY created_at ASC', [ids])
        : Promise.resolve(null)
    ]);

    const itemsByOrder = new Map<string, ReturnType<typeof mapOrderItem>[]>();
    for (const row of itemsResult.rows) {
      const key = String(row.order_id);
      const items = itemsByOrder.get(key) ?? [];
      items.push(mapOrderItem(row));
      itemsByOrder.set(key, items);
    }

    const paymentsByOrder = new Map<string, ReturnType<typeof mapPayment>[]>();
    for (const row of paymentsResult.rows) {
      const key = String(row.order_id);
      const payments = paymentsByOrder.get(key) ?? [];
      payments.push(mapPayment(row));
      paymentsByOrder.set(key, payments);
    }

    const historyByOrder = new Map<string, ReturnType<typeof mapHistory>[]>();
    if (historyResult) {
      for (const row of historyResult.rows) {
        const key = String(row.order_id);
        const history = historyByOrder.get(key) ?? [];
        history.push(mapHistory(row));
        historyByOrder.set(key, history);
      }
    }

    return rows.map((row) => {
      const related: { items: ReturnType<typeof mapOrderItem>[]; payments: ReturnType<typeof mapPayment>[]; history?: ReturnType<typeof mapHistory>[] } = {
        items: itemsByOrder.get(String(row.id)) ?? [],
        payments: paymentsByOrder.get(String(row.id)) ?? []
      };
      if (includeHistory) related.history = historyByOrder.get(String(row.id)) ?? [];
      return mapOrder(row, related);
    });
  }

  async getOrderDetailByRef(ref: string, includeHistory = true): Promise<OrderDTO> {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id::text = $1 OR public_code = $1 LIMIT 1', [ref]);
    if (!orderResult.rows[0]) throw AppError.notFound('Order not found.');
    return this.hydrateOrder(orderResult.rows[0], includeHistory);
  }

  async transitionOrder(
    ref: string,
    targetStatus: OrderStatus,
    actor: Actor,
    options: { reasonCode?: string | null; reasonNote?: string | null; metadata?: Record<string, unknown> } = {}
  ): Promise<OrderDTO> {
    const order = await withTransaction(async (client) => {
      const result = await client.query('SELECT * FROM orders WHERE id::text = $1 OR public_code = $1 FOR UPDATE', [ref]);
      const row = result.rows[0];
      if (!row) throw AppError.notFound('Order not found.');
      const currentStatus = row.status as OrderStatus;
      const currentPaymentStatus = row.payment_status as PaymentStatus;

      if (currentStatus === targetStatus) return this.hydrateOrderWithClient(client, row, true);
      if (!isValidOrderTransition(currentStatus, targetStatus)) {
        throw new AppError(409, 'INVALID_STATE_TRANSITION', `Cannot move order from ${currentStatus} to ${targetStatus}.`);
      }
      if (['REJECTED', 'FAILED', 'CANCELLED'].includes(targetStatus) && !options.reasonCode && !options.reasonNote) {
        throw AppError.validation('A reason is required for rejected, failed, or cancelled orders.');
      }

      const reasonColumn =
        targetStatus === 'REJECTED'
          ? 'rejection_reason'
          : targetStatus === 'FAILED'
            ? 'failure_reason'
            : targetStatus === 'CANCELLED'
              ? 'cancellation_reason'
              : null;
      const updateParams: unknown[] = [targetStatus, row.id];
      const reasonSql = reasonColumn ? `, ${reasonColumn} = $3` : '';
      if (reasonColumn) updateParams.push([options.reasonCode, options.reasonNote].filter(Boolean).join(': ') || null);

      const update = await client.query(
        `UPDATE orders SET status = $1${reasonSql} WHERE id = $2 RETURNING *`,
        updateParams
      );

      await this.insertHistory(client, {
        orderId: row.id,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        previousPaymentStatus: currentPaymentStatus,
        newPaymentStatus: currentPaymentStatus,
        actorUserId: actor.id,
        actorRole: actorRole(actor),
        reasonCode: options.reasonCode ?? null,
        reasonNote: options.reasonNote ?? null,
        metadata: options.metadata ?? {}
      });

      return this.hydrateOrderWithClient(client, update.rows[0], true);
    });

    await this.afterOrderMutation(order, 'ORDER_UPDATED');
    return order;
  }

  async updatePaymentStatus(
    ref: string,
    targetStatus: PaymentStatus,
    actor: Actor,
    options: { reasonNote?: string | null } = {}
  ): Promise<OrderDTO> {
    if (!canRoleAccess(actor.roles, PAYMENT_MANAGEMENT_ROLES)) {
      throw AppError.forbidden('You are not allowed to update payment status.');
    }

    const order = await withTransaction(async (client) => {
      const result = await client.query('SELECT * FROM orders WHERE id::text = $1 OR public_code = $1 FOR UPDATE', [ref]);
      const row = result.rows[0];
      if (!row) throw AppError.notFound('Order not found.');
      const currentPaymentStatus = row.payment_status as PaymentStatus;
      const currentStatus = row.status as OrderStatus;

      if (currentPaymentStatus === targetStatus) return this.hydrateOrderWithClient(client, row, true);
      if (!isValidPaymentTransition(currentPaymentStatus, targetStatus)) {
        throw new AppError(409, 'INVALID_STATE_TRANSITION', `Cannot move payment from ${currentPaymentStatus} to ${targetStatus}.`);
      }

      const update = await client.query('UPDATE orders SET payment_status = $1 WHERE id = $2 RETURNING *', [targetStatus, row.id]);
      await client.query(
        `UPDATE payments
         SET status = $1, verified_by = CASE WHEN $1 = 'PAID' THEN $2 ELSE verified_by END,
             verified_at = CASE WHEN $1 = 'PAID' THEN now() ELSE verified_at END
         WHERE order_id = $3`,
        [targetStatus, actor.id, row.id]
      );

      await this.insertHistory(client, {
        orderId: row.id,
        previousStatus: currentStatus,
        newStatus: currentStatus,
        previousPaymentStatus: currentPaymentStatus,
        newPaymentStatus: targetStatus,
        actorUserId: actor.id,
        actorRole: actorRole(actor),
        reasonCode: 'PAYMENT_STATUS_UPDATED',
        reasonNote: options.reasonNote ?? null,
        metadata: {}
      });

      return this.hydrateOrderWithClient(client, update.rows[0], true);
    });

    await this.afterOrderMutation(order, 'PAYMENT_UPDATED');
    return order;
  }

  private async getProductsForCart(client: pg.PoolClient, items: RedisCartItem[]) {
    const productIds = items.map((item) => item.productId);
    const result = await client.query<ProductRow>(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN product_categories c ON c.id = p.category_id
       WHERE p.id = ANY($1::uuid[])`,
      [productIds]
    );
    return new Map(result.rows.map((row) => [String(row.id), row]));
  }

  private async createUniquePublicCode(client: pg.PoolClient): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = generatePublicOrderCode();
      const existing = await client.query('SELECT 1 FROM orders WHERE public_code = $1', [code]);
      if (!existing.rowCount) return code;
    }
    throw AppError.conflict('Unable to allocate an order code. Please try again.');
  }

  private async hydrateOrder(row: Record<string, unknown>, includeHistory: boolean) {
    return this.hydrateOrderWithPool(row, includeHistory);
  }

  private async hydrateOrderWithPool(row: Record<string, unknown>, includeHistory: boolean) {
    const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC', [row.id]);
    const payments = await pool.query('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at ASC', [row.id]);
    const related: { items: ReturnType<typeof mapOrderItem>[]; payments: ReturnType<typeof mapPayment>[]; history?: ReturnType<typeof mapHistory>[] } = {
      items: items.rows.map(mapOrderItem),
      payments: payments.rows.map(mapPayment)
    };
    if (includeHistory) {
      const history = await pool.query('SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC', [row.id]);
      related.history = history.rows.map(mapHistory);
    }
    return mapOrder(row, related);
  }

  private async hydrateOrderWithClient(client: pg.PoolClient, row: Record<string, unknown>, includeHistory: boolean) {
    const items = await client.query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC', [row.id]);
    const payments = await client.query('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at ASC', [row.id]);
    const related: { items: ReturnType<typeof mapOrderItem>[]; payments: ReturnType<typeof mapPayment>[]; history?: ReturnType<typeof mapHistory>[] } = {
      items: items.rows.map(mapOrderItem),
      payments: payments.rows.map(mapPayment)
    };
    if (includeHistory) {
      const history = await client.query('SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC', [row.id]);
      related.history = history.rows.map(mapHistory);
    }
    return mapOrder(row, related);
  }

  private async insertHistory(
    client: pg.PoolClient,
    input: {
      orderId: string;
      previousStatus: OrderStatus | null;
      newStatus: OrderStatus;
      previousPaymentStatus: PaymentStatus | null;
      newPaymentStatus: PaymentStatus | null;
      actorUserId: string | null;
      actorRole: string | null;
      reasonCode: string | null;
      reasonNote: string | null;
      metadata: Record<string, unknown>;
    }
  ) {
    await client.query(
      `INSERT INTO order_status_history (
        order_id, previous_status, new_status, previous_payment_status, new_payment_status,
        actor_user_id, actor_role, reason_code, reason_note, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        input.orderId,
        input.previousStatus,
        input.newStatus,
        input.previousPaymentStatus,
        input.newPaymentStatus,
        input.actorUserId,
        input.actorRole,
        input.reasonCode,
        input.reasonNote,
        input.metadata
      ]
    );
  }

  private async afterOrderMutation(order: OrderDTO, type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'PAYMENT_UPDATED') {
    await publishRealtimeEvent(type, realtimeTopics.order(order.id), order);
    await publishRealtimeEvent(type, realtimeTopics.operations, order);

    try {
      if (type === 'ORDER_CREATED') {
        await emailQueue.add('order-confirmation', { orderId: order.id, publicCode: order.publicCode });
        await notificationQueue.add('new-order', { orderId: order.id, publicCode: order.publicCode });
      } else {
        await notificationQueue.add('order-updated', { orderId: order.id, publicCode: order.publicCode, status: order.status });
      }
      await analyticsQueue.add('order-event', { orderId: order.id, status: order.status, paymentStatus: order.paymentStatus });
    } catch (error) {
      logger.warn({ err: error, orderId: order.id }, 'Non-critical queue publish failed');
    }
  }
}

export const orderService = new OrderService();
