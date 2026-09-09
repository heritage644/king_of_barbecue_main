import { Router } from 'express';
import { webhookController } from '../controllers/WebhookController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const webhookRoutes = Router();

webhookRoutes.post('/payment-provider', asyncHandler((req, res) => webhookController.paymentProvider(req, res)));
