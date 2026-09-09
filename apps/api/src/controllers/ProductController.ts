import type { Request, Response } from 'express';
import { productService } from '../services/ProductService.js';
import { param } from '../utils/params.js';

export class ProductController {
  async listCategories(_req: Request, res: Response) {
    res.json({ categories: await productService.listCategories() });
  }

  async listProducts(req: Request, res: Response) {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const featured = typeof req.query.featured === 'string' ? req.query.featured === 'true' : undefined;
    const options: { category?: string; featured?: boolean } = {};
    if (category !== undefined) options.category = category;
    if (featured !== undefined) options.featured = featured;
    res.json({ products: await productService.listProducts(options) });
  }

  async getProduct(req: Request, res: Response) {
    res.json({ product: await productService.getProduct(param(req, 'idOrSlug')) });
  }
}

export const productController = new ProductController();
