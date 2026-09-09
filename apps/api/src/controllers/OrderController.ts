import type { Request, Response } from 'express';
import { orderService } from '../services/OrderService.js';
import { getOrCreateCartId } from './CartController.js';
import { setOrderTrackingCookie, trackingCookieName } from '../middleware/auth.js';
import { streamTopic } from '../realtime/sse.js';
import { realtimeTopics } from '../realtime/eventBus.js';
import { param } from '../utils/params.js';

function trackingTokenFor(req: Request, publicOrderCode: string) {
  const cookieValue = req.cookies?.[trackingCookieName(publicOrderCode)];
  return typeof cookieValue === 'string' ? cookieValue : undefined;
}

export class OrderController {
  async createOrder(req: Request, res: Response) {
    const cartId = getOrCreateCartId(req, res);
    const { order, trackingToken } = await orderService.createOrderFromCart(cartId, req.body);
    setOrderTrackingCookie(res, order.publicCode, trackingToken);
    res.status(201).json({ order });
  }

  async getOrder(req: Request, res: Response) {
    const publicCode = param(req, 'publicCode');
    const order = await orderService.getOrderForCustomer(publicCode, req.user, trackingTokenFor(req, publicCode));
    res.json({ order });
  }

  async streamOrder(req: Request, res: Response) {
    const publicCode = param(req, 'publicCode');
    const order = await orderService.getOrderForCustomer(publicCode, req.user, trackingTokenFor(req, publicCode));
    streamTopic(req, res, realtimeTopics.order(order.id));
  }

  async myOrders(req: Request, res: Response) {
    res.json({ orders: await orderService.listOrdersForUser(req.user!.id) });
  }
}

export const orderController = new OrderController();
