import type { Request, Response } from 'express';
import { cartService } from '../services/CartService.js';
import { CART_COOKIE_NAME } from '../middleware/auth.js';
import { getApiConfig } from '@kob/config';
import { param } from '../utils/params.js';

const config = getApiConfig();

function getOrCreateCartId(req: Request, res: Response) {
  const existing = typeof req.cookies?.[CART_COOKIE_NAME] === 'string' ? req.cookies[CART_COOKIE_NAME] : undefined;
  const cartId = existing ?? cartService.createCartId();
  if (!existing) {
    res.cookie(CART_COOKIE_NAME, cartId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1_000,
      path: '/'
    });
  }
  return cartId;
}

export class CartController {
  async getCart(req: Request, res: Response) {
    const cartId = getOrCreateCartId(req, res);
    res.json({ cart: await cartService.getSummary(cartId) });
  }

  async addItem(req: Request, res: Response) {
    const cartId = getOrCreateCartId(req, res);
    res.status(201).json({ cart: await cartService.addItem(cartId, req.body) });
  }

  async updateItem(req: Request, res: Response) {
    const cartId = getOrCreateCartId(req, res);
    res.json({ cart: await cartService.updateItem(cartId, param(req, 'productId'), req.body) });
  }

  async removeItem(req: Request, res: Response) {
    const cartId = getOrCreateCartId(req, res);
    res.json({ cart: await cartService.removeItem(cartId, param(req, 'productId')) });
  }

  async clear(req: Request, res: Response) {
    const cartId = getOrCreateCartId(req, res);
    await cartService.clearCart(cartId);
    res.json({ cart: await cartService.getSummary(cartId) });
  }
}

export const cartController = new CartController();
export { getOrCreateCartId };
