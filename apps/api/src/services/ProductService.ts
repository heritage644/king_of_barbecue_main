import type { ProductCategoryDTO, ProductDTO } from '@kob/shared-types';
import { pool } from '../db/pool.js';
import { AppError } from '../errors/AppError.js';

function mapCategory(row: Record<string, unknown>): ProductCategoryDTO {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    sortOrder: Number(row.sort_order)
  };
}

export function mapProduct(row: Record<string, unknown>): ProductDTO {
  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    categoryName: row.category_name ? String(row.category_name) : undefined,
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ''),
    imageUrl: row.image_url ? String(row.image_url) : null,
    priceCents: Number(row.price_cents),
    currency: String(row.currency ?? 'NGN'),
    isAvailable: Boolean(row.is_available),
    isFeatured: Boolean(row.is_featured)
  };
}

export class ProductService {
  async listCategories(): Promise<ProductCategoryDTO[]> {
    const result = await pool.query(
      `SELECT id, slug, name, description, sort_order
       FROM product_categories
       WHERE is_active = true
       ORDER BY sort_order ASC, name ASC`
    );
    return result.rows.map(mapCategory);
  }

  async listProducts(options: { category?: string; featured?: boolean } = {}): Promise<ProductDTO[]> {
    const params: unknown[] = [];
    const where = ['c.is_active = true'];

    if (options.category) {
      params.push(options.category);
      where.push(`c.slug = $${params.length}`);
    }

    if (typeof options.featured === 'boolean') {
      params.push(options.featured);
      where.push(`p.is_featured = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN product_categories c ON c.id = p.category_id
       WHERE ${where.join(' AND ')}
       ORDER BY c.sort_order ASC, p.sort_order ASC, p.name ASC`,
      params
    );
    return result.rows.map(mapProduct);
  }

  async getProduct(identifier: string): Promise<ProductDTO> {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN product_categories c ON c.id = p.category_id
       WHERE p.id::text = $1 OR p.slug = $1
       LIMIT 1`,
      [identifier]
    );

    if (!result.rows[0]) {
      throw AppError.notFound('Product not found.');
    }

    return mapProduct(result.rows[0]);
  }
}

export const productService = new ProductService();
