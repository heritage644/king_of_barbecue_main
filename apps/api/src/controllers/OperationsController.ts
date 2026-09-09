import type { Request, Response } from 'express';
import { orderService } from '../services/OrderService.js';
import { streamTopic } from '../realtime/sse.js';
import { realtimeTopics } from '../realtime/eventBus.js';
import { param } from '../utils/params.js';

export class OperationsController {
  async listOrders(req: Request, res: Response) {
    res.json(await orderService.listOperationsOrders(req.query as never));
  }

  async getOrder(req: Request, res: Response) {
    res.json({ order: await orderService.getOrderDetailByRef(param(req, 'id')) });
  }

  async approve(req: Request, res: Response) {
    res.json({ order: await orderService.transitionOrder(param(req, 'id'), 'APPROVED', req.user!) });
  }

  async reject(req: Request, res: Response) {
    res.json({
      order: await orderService.transitionOrder(param(req, 'id'), 'REJECTED', req.user!, {
        reasonCode: req.body.reasonCode,
        reasonNote: req.body.reasonNote
      })
    });
  }

  async fail(req: Request, res: Response) {
    res.json({
      order: await orderService.transitionOrder(param(req, 'id'), 'FAILED', req.user!, {
        reasonCode: req.body.reasonCode,
        reasonNote: req.body.reasonNote
      })
    });
  }

  async cancel(req: Request, res: Response) {
    res.json({
      order: await orderService.transitionOrder(param(req, 'id'), 'CANCELLED', req.user!, {
        reasonCode: req.body.reasonCode,
        reasonNote: req.body.reasonNote
      })
    });
  }

  async updateStatus(req: Request, res: Response) {
    res.json({
      order: await orderService.transitionOrder(param(req, 'id'), req.body.status, req.user!, {
        reasonCode: req.body.reasonCode,
        reasonNote: req.body.reasonNote
      })
    });
  }

  async updatePayment(req: Request, res: Response) {
    res.json({
      order: await orderService.updatePaymentStatus(param(req, 'id'), req.body.paymentStatus, req.user!, {
        reasonNote: req.body.reasonNote
      })
    });
  }

  async stream(req: Request, res: Response) {
    streamTopic(req, res, realtimeTopics.operations);
  }
}

export const operationsController = new OperationsController();
