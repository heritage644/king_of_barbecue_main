import { Router } from 'express';
import { productController } from '../controllers/ProductController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const categoryRoutes = Router();
export const productRoutes = Router();

categoryRoutes.get('/', asyncHandler((req, res) => productController.listCategories(req, res)));
productRoutes.get('/', asyncHandler((req, res) => productController.listProducts(req, res)));
productRoutes.get('/:idOrSlug', asyncHandler((req, res) => productController.getProduct(req, res)));
