import type { Request, Response } from 'express';
import { orderService } from '../services/OrderService.js';
import { streamTopic } from '../realtime/sse.js';
import { realtimeTopics } from '../realtime/eventBus.js';
import { param } from '../utils/params.js';

export class OperationsController {
  async listOrders(req: Request, res: Response) {
    try {
      // Clean empty string query params to avoid backend validation crashes
      const rawQuery = (req.query || {}) as Record<string, unknown>;
      const queryParams: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(rawQuery)) {
        if (typeof val === 'string' && val.trim() !== '') {
          queryParams[key] = val.trim();
        } else if (val !== undefined && val !== null && val !== '') {
          queryParams[key] = val;
        }
      }

      const result = await orderService.listOperationsOrders(queryParams as never);

      // Standardize output structure for frontend compatibility
      if (Array.isArray(result)) {
        return res.json({ orders: result, total: result.length });
      }

      return res.json({
        orders: result?.orders ?? [],
        total: result?.total ?? result?.orders?.length ?? 0
      });
    } catch (err) {
      console.error('Error listing operations orders:', err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : 'Failed to fetch operations orders.'
      });
    }
  }

  async getOrder(req: Request, res: Response) {
    try {
      const order = await orderService.getOrderDetailByRef(param(req, 'id'));
      if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
      }
      return res.json({ order });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to retrieve order details.' });
    }
  }

  async approve(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Staff authentication required.' });
    }

    try {
      const orderId = param(req, 'id');
      const body = req.body || {};
      const order = await orderService.transitionOrder(orderId, 'APPROVED', req.user, {
        reasonCode: body.reasonCode,
        reasonNote: body.reasonNote
      });
      return res.json({ order });
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Failed to approve order.' });
    }
  }

  async reject(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Staff authentication required.' });
    }

    try {
      const body = req.body || {};
      const order = await orderService.transitionOrder(param(req, 'id'), 'REJECTED', req.user, {
        reasonCode: body.reasonCode,
        reasonNote: body.reasonNote
      });
      return res.json({ order });
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Failed to reject order.' });
    }
  }

  async fail(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Staff authentication required.' });
    }

    try {
      const body = req.body || {};
      const order = await orderService.transitionOrder(param(req, 'id'), 'FAILED', req.user, {
        reasonCode: body.reasonCode,
        reasonNote: body.reasonNote
      });
      return res.json({ order });
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Failed to fail order.' });
    }
  }

  async cancel(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Staff authentication required.' });
    }

    try {
      const body = req.body || {};
      const order = await orderService.transitionOrder(param(req, 'id'), 'CANCELLED', req.user, {
        reasonCode: body.reasonCode,
        reasonNote: body.reasonNote
      });
      return res.json({ order });
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Failed to cancel order.' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Staff authentication required.' });
    }

    try {
      const body = req.body || {};
      const order = await orderService.transitionOrder(param(req, 'id'), body.status, req.user, {
        reasonCode: body.reasonCode,
        reasonNote: body.reasonNote
      });
      return res.json({ order });
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Failed to update order status.' });
    }
  }

  async updatePayment(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Staff authentication required.' });
    }

    try {
      const body = req.body || {};
      const order = await orderService.updatePaymentStatus(param(req, 'id'), body.paymentStatus, req.user, {
        reasonNote: body.reasonNote
      });
      return res.json({ order });
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Failed to update payment status.' });
    }
  }

  async stream(req: Request, res: Response) {
    try {
      streamTopic(req, res, realtimeTopics.operations);
    } catch (err) {
      res.status(500).json({ message: 'Unable to start SSE stream.' });
    }
  }
}

export const operationsController = new OperationsController();