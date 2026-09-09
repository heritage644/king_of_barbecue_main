import bcrypt from 'bcryptjs';
import type { UserDTO, UserRole } from '@kob/shared-types';
import { normalizeEmail, normalizePhone } from '@kob/shared-types';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import { AppError } from '../errors/AppError.js';
import { guestAccountLinkingQueue } from '../infra/queues.js';
import { logger } from '../infra/logger.js';
import { hashToken } from '../utils/security.js';

function parseRoles(value: unknown): UserRole[] {
  if (Array.isArray(value)) return value as UserRole[];
  if (typeof value === 'string') {
    return value
      .replace(/[{}\"]/g, '')
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean) as UserRole[];
  }
  return [];
}

function mapUser(row: Record<string, unknown>): UserDTO {
  return {
    id: String(row.id),
    email: String(row.email),
    fullName: String(row.full_name),
    phone: row.phone ? String(row.phone) : null,
    roles: parseRoles(row.roles),
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

export class AuthService {
  async login(input: { email: string; password: string }): Promise<UserDTO> {
    const email = normalizeEmail(input.email);
    const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = result.rows[0];
    if (!user) throw AppError.invalidCredentials();

    const passwordMatches = await bcrypt.compare(input.password, String(user.password_hash));
    if (!passwordMatches) throw AppError.invalidCredentials();

    return mapUser(user);
  }

  async getById(id: string): Promise<UserDTO | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async createAccountFromGuest(input: {
    publicOrderCode: string;
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    trackingToken?: string;
  }): Promise<UserDTO> {
    const email = normalizeEmail(input.email);
    const phone = input.phone ? normalizePhone(input.phone) : undefined;
    const tokenHash = input.trackingToken ? hashToken(input.trackingToken) : undefined;

    const result = await withTransaction(async (client) => {
      const existing = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
      if (existing.rows[0]) {
        throw AppError.conflict('An account with this email already exists. Please log in instead.');
      }

      const orderResult = await client.query(
        `SELECT id, guest_email, guest_name, guest_phone, user_id, tracking_token_hash
         FROM orders
         WHERE public_code = $1
         LIMIT 1`,
        [input.publicOrderCode]
      );
      const order = orderResult.rows[0];
      if (!order) throw AppError.notFound('Order not found.');
      if (normalizeEmail(String(order.guest_email)) !== email) {
        throw AppError.forbidden('This email does not match the guest order.');
      }
      if (!tokenHash || tokenHash !== String(order.tracking_token_hash)) {
        throw AppError.forbidden('Order tracking session is required to claim this order.');
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const created = await client.query(
        `INSERT INTO users (email, full_name, phone, password_hash, roles)
         VALUES ($1, $2, $3, $4, ARRAY['CUSTOMER']::user_role[])
         RETURNING *`,
        [email, input.fullName ?? String(order.guest_name), phone ?? String(order.guest_phone), passwordHash]
      );
      const user = mapUser(created.rows[0]);

      if (!order.user_id) {
        await client.query('UPDATE orders SET user_id = $1 WHERE id = $2', [user.id, order.id]);
      }

      return { user, order };
    });

    try {
      await guestAccountLinkingQueue.add('link-historical-guest-orders', {
        userId: result.user.id,
        email,
        phone: phone ?? String(result.order.guest_phone),
        sourceOrderId: String(result.order.id)
      });
    } catch (error) {
      logger.warn({ err: error, userId: result.user.id }, 'Unable to enqueue guest account linking job');
    }

    return result.user;
  }
}

export const authService = new AuthService();
