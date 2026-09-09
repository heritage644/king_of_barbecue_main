import { nanoid } from 'nanoid';
import { calculateLineTotal, type CartDTO } from '@kob/shared-types';
import { redis } from '../infra/redis.js';
import { pool } from '../db/pool.js';
import { AppError } from '../errors/AppError.js';
import { mapProduct } from './ProductService.js';

export interface RedisCartItem {
  productId: string;
  quantity: number;
  specialInstructions?: string | null;
  updatedAt: string;
}

interface RedisCart {
  id: string;
  items: RedisCartItem[];
  createdAt: string;
  updatedAt: string;
}

const CART_TTL_SECONDS = 7 * 24 * 60 * 60;

function cartKey(cartId: string) {
  return `cart:${cartId}`;
}

function emptyCart(cartId: string): RedisCart {
  const now = new Date().toISOString();
  return { id: cartId, items: [], createdAt: now, updatedAt: now };
}

export class CartService {
  createCartId(): string {
    return nanoid(28);
  }

  async getRawCart(cartId: string): Promise<RedisCart> {
    const raw = await redis.get(cartKey(cartId));
    if (!raw) return emptyCart(cartId);

    try {
      const parsed = JSON.parse(raw) as RedisCart;
      if (!Array.isArray(parsed.items)) return emptyCart(cartId);
      return parsed;
    } catch {
      return emptyCart(cartId);
    }
  }

  async saveRawCart(cart: RedisCart): Promise<void> {
    cart.updatedAt = new Date().toISOString();
    await redis.set(cartKey(cart.id), JSON.stringify(cart), 'EX', CART_TTL_SECONDS);
  }

  async addItem(cartId: string, input: { productId: string; quantity: number; specialInstructions?: string | null }): Promise<CartDTO> {
    const product = await this.getAvailableProduct(input.productId);
    if (!product.isAvailable) {
      throw AppError.conflict('This item is currently unavailable.');
    }

    const cart = await this.getRawCart(cartId);
    const existing = cart.items.find((item) => item.productId === input.productId);
    const now = new Date().toISOString();

    if (existing) {
      existing.quantity = Math.min(existing.quantity + input.quantity, 50);
      if (input.specialInstructions !== undefined) existing.specialInstructions = input.specialInstructions;
      existing.updatedAt = now;
    } else {
      cart.items.push({
        productId: input.productId,
        quantity: input.quantity,
        specialInstructions: input.specialInstructions ?? null,
        updatedAt: now
      });
    }

    await this.saveRawCart(cart);
    return this.getSummary(cartId);
  }

  async updateItem(cartId: string, productId: string, input: { quantity: number; specialInstructions?: string | null }): Promise<CartDTO> {
    const cart = await this.getRawCart(cartId);
    if (input.quantity === 0) {
      cart.items = cart.items.filter((item) => item.productId !== productId);
    } else {
      const existing = cart.items.find((item) => item.productId === productId);
      if (!existing) {
        throw AppError.notFound('Cart item not found.');
      }
      existing.quantity = input.quantity;
      if (input.specialInstructions !== undefined) existing.specialInstructions = input.specialInstructions;
      existing.updatedAt = new Date().toISOString();
    }

    await this.saveRawCart(cart);
    return this.getSummary(cartId);
  }

  async removeItem(cartId: string, productId: string): Promise<CartDTO> {
    const cart = await this.getRawCart(cartId);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    await this.saveRawCart(cart);
    return this.getSummary(cartId);
  }

  async clearCart(cartId: string): Promise<void> {
    await redis.del(cartKey(cartId));
  }

  async getSummary(cartId: string): Promise<CartDTO> {
    const cart = await this.getRawCart(cartId);
    if (cart.items.length === 0) {
      return { id: cartId, items: [], subtotalCents: 0, currency: 'NGN' };
    }

    const productIds = cart.items.map((item) => item.productId);
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN product_categories c ON c.id = p.category_id
       WHERE p.id = ANY($1::uuid[])`,
      [productIds]
    );
    const products = new Map(result.rows.map((row) => [String(row.id), mapProduct(row)]));

    const items = cart.items.flatMap((cartItem) => {
      const product = products.get(cartItem.productId);
      if (!product) return [];
      return [
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl ?? null,
          unitPriceCents: product.priceCents,
          quantity: cartItem.quantity,
          lineTotalCents: calculateLineTotal(product.priceCents, cartItem.quantity),
          currency: product.currency,
          isAvailable: product.isAvailable,
          specialInstructions: cartItem.specialInstructions ?? null
        }
      ];
    });

    const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
    return {
      id: cartId,
      items,
      subtotalCents,
      currency: items[0]?.currency ?? 'NGN'
    };
  }

  private async getAvailableProduct(productId: string) {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN product_categories c ON c.id = p.category_id
       WHERE p.id = $1
       LIMIT 1`,
      [productId]
    );
    if (!result.rows[0]) throw AppError.notFound('Product not found.');
    return mapProduct(result.rows[0]);
  }
}

export const cartService = new CartService();
