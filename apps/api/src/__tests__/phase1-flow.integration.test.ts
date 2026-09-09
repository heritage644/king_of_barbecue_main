import crypto from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const integrationEnabled = process.env.RUN_INTEGRATION_TESTS === 'true';
const describeIntegration = integrationEnabled ? describe : describe.skip;

describeIntegration('Phase 1 HTTP integration flow', () => {
  let app: Express;
  let cleanup: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    if (process.env.TEST_REDIS_URL) process.env.REDIS_URL = process.env.TEST_REDIS_URL;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-test-secret-test-secret-32';

    const appModule = await import('../app.js');
    app = appModule.createApp();

    cleanup = async () => {
      const [{ pool }, { redis }, { closeQueues }] = await Promise.all([
        import('../db/pool.js'),
        import('../infra/redis.js'),
        import('../infra/queues.js')
      ]);
      await Promise.allSettled([closeQueues(), redis.quit(), pool.end()]);
    };
  });

  afterAll(async () => {
    await cleanup?.();
  });

  it('creates a guest order and lets authorized staff verify payment and approve it', async () => {
    const customer = request.agent(app);
    const productsResponse = await customer.get('/api/products').expect(200);
    const product = productsResponse.body.products[0];
    expect(product).toBeTruthy();

    await customer
      .post('/api/cart/items')
      .send({ productId: product.id, quantity: 1, specialInstructions: 'NO PEPPER' })
      .expect(201);

    const checkoutResponse = await customer
      .post('/api/orders')
      .send({
        fullName: 'Integration Guest',
        email: 'integration.guest@example.com',
        phone: '+2348000000999',
        fulfillmentMethod: 'PICKUP',
        paymentMethod: 'MANUAL_TRANSFER',
        idempotencyKey: crypto.randomUUID()
      })
      .expect(201);

    const order = checkoutResponse.body.order;
    expect(order.status).toBe('PENDING');
    expect(order.paymentStatus).toBe('UNPAID');

    const staff = request.agent(app);
    await staff.post('/api/auth/login').send({ email: 'admin@kingbbq.local', password: 'password123' }).expect(200);

    await staff.patch(`/api/operations/orders/${order.id}/payment`).send({ paymentStatus: 'PAID' }).expect(200);
    const approved = await staff.patch(`/api/operations/orders/${order.id}/approve`).expect(200);
    expect(approved.body.order.status).toBe('APPROVED');
    expect(approved.body.order.paymentStatus).toBe('PAID');

    const tracked = await customer.get(`/api/orders/${order.publicCode}`).expect(200);
    expect(tracked.body.order.publicCode).toBe(order.publicCode);
    expect(tracked.body.order.history.length).toBeGreaterThanOrEqual(3);
  });
});
