import { Router } from 'express';
import { storeController } from '../controllers/StoreController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const storeRoutes = Router();

storeRoutes.get('/settings', asyncHandler((req, res) => storeController.getSettings(req, res)));
storeRoutes.get('/stream', asyncHandler((req, res) => storeController.stream(req, res)));
