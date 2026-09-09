import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
import { logger } from '../infra/logger.js';

interface CategorySeed {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}

interface ProductSeed {
  categorySlug: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  isFeatured?: boolean;
  sortOrder: number;
}

const categories: CategorySeed[] = [
  { slug: 'grills', name: 'Grills', description: 'Fire-kissed barbecue classics from our signature pit.', sortOrder: 10 },
  { slug: 'rice', name: 'Rice Meals', description: 'Comforting rice plates built for generous appetites.', sortOrder: 20 },
  { slug: 'fish', name: 'Fish', description: 'Whole fish and fillets with bright pepper sauces.', sortOrder: 30 },
  { slug: 'chicken', name: 'Chicken', description: 'Smoky, juicy chicken finished over open flame.', sortOrder: 40 },
  { slug: 'sides', name: 'Sides', description: 'The crunchy, saucy, comforting extras.', sortOrder: 50 },
  { slug: 'drinks', name: 'Drinks', description: 'Cold drinks to cool down the spice.', sortOrder: 60 }
];

const products: ProductSeed[] = [
  {
    categorySlug: 'grills',
    slug: 'royal-mixed-grill-platter',
    name: 'Royal Mixed Grill Platter',
    description: 'A generous platter of smoky beef, chicken, sausage, plantain and house pepper sauce.',
    priceCents: 1850000,
    imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=80',
    isFeatured: true,
    sortOrder: 10
  },
  {
    categorySlug: 'grills',
    slug: 'suya-beef-skewers',
    name: 'Suya Beef Skewers',
    description: 'Tender beef skewers dusted with yaji spice, onions and fresh tomato.',
    priceCents: 650000,
    imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80',
    isFeatured: true,
    sortOrder: 20
  },
  {
    categorySlug: 'rice',
    slug: 'smoky-party-jollof',
    name: 'Smoky Party Jollof',
    description: 'Firewood-style jollof rice served with coleslaw and a choice of protein.',
    priceCents: 420000,
    imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=1200&q=80',
    isFeatured: true,
    sortOrder: 10
  },
  {
    categorySlug: 'rice',
    slug: 'fried-rice-and-bbq-chicken',
    name: 'Fried Rice & BBQ Chicken',
    description: 'Vegetable fried rice paired with a glazed barbecue chicken quarter.',
    priceCents: 520000,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 20
  },
  {
    categorySlug: 'fish',
    slug: 'whole-grilled-croaker',
    name: 'Whole Grilled Croaker',
    description: 'Charcoal grilled croaker with yam chips and bright ata din-din sauce.',
    priceCents: 980000,
    imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80',
    isFeatured: true,
    sortOrder: 10
  },
  {
    categorySlug: 'chicken',
    slug: 'pepper-bbq-chicken',
    name: 'Pepper BBQ Chicken',
    description: 'Juicy chicken brushed with our pepper glaze and finished over glowing coals.',
    priceCents: 580000,
    imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=1200&q=80',
    isFeatured: true,
    sortOrder: 10
  },
  {
    categorySlug: 'sides',
    slug: 'sweet-plantain-bites',
    name: 'Sweet Plantain Bites',
    description: 'Golden fried ripe plantain finished with smoked sea salt.',
    priceCents: 180000,
    imageUrl: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 10
  },
  {
    categorySlug: 'sides',
    slug: 'yam-chips',
    name: 'Yam Chips',
    description: 'Crisp yam chips with our smoky house dip.',
    priceCents: 220000,
    imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 20
  },
  {
    categorySlug: 'drinks',
    slug: 'zobo-chiller',
    name: 'Zobo Chiller',
    description: 'Cold hibiscus, ginger and pineapple house drink.',
    priceCents: 120000,
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 10
  }
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const category of categories) {
      await client.query(
        `INSERT INTO product_categories (slug, name, description, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           sort_order = EXCLUDED.sort_order,
           is_active = true`,
        [category.slug, category.name, category.description, category.sortOrder]
      );
    }

    for (const product of products) {
      const category = await client.query('SELECT id FROM product_categories WHERE slug = $1', [product.categorySlug]);
      if (!category.rows[0]) throw new Error(`Missing category ${product.categorySlug}`);
      await client.query(
        `INSERT INTO products (category_id, slug, name, description, image_url, price_cents, currency, is_available, is_featured, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, 'NGN', true, $7, $8)
         ON CONFLICT (slug) DO UPDATE SET
           category_id = EXCLUDED.category_id,
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           image_url = EXCLUDED.image_url,
           price_cents = EXCLUDED.price_cents,
           currency = EXCLUDED.currency,
           is_available = true,
           is_featured = EXCLUDED.is_featured,
           sort_order = EXCLUDED.sort_order`,
        [
          category.rows[0].id,
          product.slug,
          product.name,
          product.description,
          product.imageUrl,
          product.priceCents,
          Boolean(product.isFeatured),
          product.sortOrder
        ]
      );
    }

    const staffPasswordHash = await bcrypt.hash('password123', 12);
    const customerPasswordHash = await bcrypt.hash('customer123', 12);

    await client.query(
      `INSERT INTO users (email, full_name, phone, password_hash, roles)
       VALUES ($1, $2, $3, $4, ARRAY['CASHIER','OPERATIONS_STAFF','MANAGER','ADMIN']::user_role[])
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, roles = EXCLUDED.roles`,
      ['admin@kingbbq.local', 'King BBQ Operations Lead', '+2348000000001', staffPasswordHash]
    );

    await client.query(
      `INSERT INTO users (email, full_name, phone, password_hash, roles)
       VALUES ($1, $2, $3, $4, ARRAY['CUSTOMER']::user_role[])
       ON CONFLICT (email) DO NOTHING`,
      ['customer@example.com', 'Demo Customer', '+2348000000002', customerPasswordHash]
    );

    await client.query('COMMIT');
    logger.info('Seed data inserted. Staff login: admin@kingbbq.local / password123');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error }, 'Seed failed');
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .then(async () => {
    await pool.end();
  })
  .catch(async () => {
    await pool.end();
    process.exitCode = 1;
  });
