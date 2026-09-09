import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import rateLimit from 'express-rate-limit';
import { getApiConfig } from '@kob/config';
import { authRoutes } from './routes/authRoutes.js';
import { cartRoutes } from './routes/cartRoutes.js';
import { categoryRoutes, productRoutes } from './routes/productRoutes.js';
import { orderRoutes } from './routes/orderRoutes.js';
import { operationRoutes } from './routes/operationRoutes.js';
import { storeRoutes } from './routes/storeRoutes.js';
import { webhookRoutes } from './routes/webhookRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './infra/logger.js';

const config = getApiConfig();

function isAllowedOrigin(origin: string) {
  if (config.corsOrigins.includes('*')) return true;
  if (config.corsOrigins.includes(origin)) return true;
  if (/^https:\/\/\d+-[a-zA-Z0-9-]+\.e2b\.app$/.test(origin)) return true;
  return false;
}

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers.accept?.includes('text/event-stream')) return false;
        return compression.filter(req, res);
      }
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS.`));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      redact: ['req.headers.authorization', 'req.headers.cookie']
    })
  );

  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false
    })
  );

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'api' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'api' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/operations', operationRoutes);
  app.use('/api/store', storeRoutes);
  app.use('/api/webhooks', webhookRoutes);

  app.use(errorHandler);

  return app;
}
