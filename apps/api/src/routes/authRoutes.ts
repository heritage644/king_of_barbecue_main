import { Router } from 'express';
import { createAccountFromGuestSchema, loginSchema } from '@kob/shared-types';
import { authController } from '../controllers/AuthController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRoutes = Router();

authRoutes.post('/login', validateBody(loginSchema), asyncHandler((req, res) => authController.login(req, res)));
authRoutes.post('/logout', asyncHandler((req, res) => authController.logout(req, res)));
authRoutes.get('/me', optionalAuth, asyncHandler((req, res) => authController.me(req, res)));
authRoutes.post('/guest-account', validateBody(createAccountFromGuestSchema), asyncHandler((req, res) => authController.createAccountFromGuest(req, res)));
authRoutes.get('/session', requireAuth, asyncHandler((req, res) => authController.me(req, res)));
