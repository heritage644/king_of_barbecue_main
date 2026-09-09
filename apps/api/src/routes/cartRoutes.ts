import { Router } from 'express';
import { addCartItemSchema, updateCartItemSchema } from '@kob/shared-types';
import { cartController } from '../controllers/CartController.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cartRoutes = Router();

cartRoutes.get('/', asyncHandler((req, res) => cartController.getCart(req, res)));
cartRoutes.post('/items', validateBody(addCartItemSchema), asyncHandler((req, res) => cartController.addItem(req, res)));
cartRoutes.patch('/items/:productId', validateBody(updateCartItemSchema), asyncHandler((req, res) => cartController.updateItem(req, res)));
cartRoutes.delete('/items/:productId', asyncHandler((req, res) => cartController.removeItem(req, res)));
cartRoutes.delete('/', asyncHandler((req, res) => cartController.clear(req, res)));
