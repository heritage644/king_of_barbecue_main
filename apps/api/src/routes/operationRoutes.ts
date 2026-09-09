import { Router } from 'express';
import {
  failOrderSchema,
  orderListQuerySchema,
  OPERATION_ROLES,
  PAYMENT_MANAGEMENT_ROLES,
  paymentUpdateSchema,
  rejectOrderSchema,
  statusUpdateSchema,
  STORE_CONTROL_ROLES,
  storePauseSchema
} from '@kob/shared-types';
import { operationsController } from '../controllers/OperationsController.js';
import { storeController } from '../controllers/StoreController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const operationRoutes = Router();

operationRoutes.use(requireAuth);
operationRoutes.use(requireRole(OPERATION_ROLES));

operationRoutes.get('/orders', validateQuery(orderListQuerySchema), asyncHandler((req, res) => operationsController.listOrders(req, res)));
operationRoutes.get('/orders/:id', asyncHandler((req, res) => operationsController.getOrder(req, res)));
operationRoutes.patch('/orders/:id/approve', asyncHandler((req, res) => operationsController.approve(req, res)));
operationRoutes.patch('/orders/:id/reject', validateBody(rejectOrderSchema), asyncHandler((req, res) => operationsController.reject(req, res)));
operationRoutes.patch('/orders/:id/fail', validateBody(failOrderSchema), asyncHandler((req, res) => operationsController.fail(req, res)));
operationRoutes.patch('/orders/:id/cancel', validateBody(statusUpdateSchema), asyncHandler((req, res) => operationsController.cancel(req, res)));
operationRoutes.patch('/orders/:id/status', validateBody(statusUpdateSchema), asyncHandler((req, res) => operationsController.updateStatus(req, res)));
operationRoutes.patch(
  '/orders/:id/payment',
  requireRole(PAYMENT_MANAGEMENT_ROLES),
  validateBody(paymentUpdateSchema),
  asyncHandler((req, res) => operationsController.updatePayment(req, res))
);
operationRoutes.get('/stream', asyncHandler((req, res) => operationsController.stream(req, res)));
operationRoutes.post('/store/pause', requireRole(STORE_CONTROL_ROLES), validateBody(storePauseSchema), asyncHandler((req, res) => storeController.pause(req, res)));
operationRoutes.post('/store/resume', requireRole(STORE_CONTROL_ROLES), asyncHandler((req, res) => storeController.resume(req, res)));
