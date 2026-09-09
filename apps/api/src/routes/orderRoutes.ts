import { Router } from 'express';
import { checkoutSchema } from '@kob/shared-types';
import { orderController } from '../controllers/OrderController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const orderRoutes = Router();

orderRoutes.post('/', validateBody(checkoutSchema), asyncHandler((req, res) => orderController.createOrder(req, res)));
orderRoutes.get('/me', requireAuth, asyncHandler((req, res) => orderController.myOrders(req, res)));
orderRoutes.get('/:publicCode', optionalAuth, asyncHandler((req, res) => orderController.getOrder(req, res)));
orderRoutes.get('/:publicCode/stream', optionalAuth, asyncHandler((req, res) => orderController.streamOrder(req, res)));
