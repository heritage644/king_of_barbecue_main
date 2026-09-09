import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: process.env.ENV_FILE ?? '.env' });

const boolFromString = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (typeof value === 'boolean') return value;
    if (!value) return false;
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  });

const commonEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().url().default('postgres://postgres:postgres@localhost:5432/king_of_barbecue'),
  REDIS_URL: z.string().url().default('redis://localhost:6379')
});

const apiEnvSchema = commonEnvSchema.extend({
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://127.0.0.1:3000'),
  JWT_SECRET: z.string().min(32).default('development-only-change-me-please-32-characters'),
  COOKIE_SECURE: boolFromString
});

const webEnvSchema = z.object({
  NEXT_PUBLIC_API_PROXY_BASE: z.string().default('/api/backend'),
  API_INTERNAL_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_RESTAURANT_NAME: z.string().default('King of Barbecue')
});

export type ApiConfig = ReturnType<typeof getApiConfig>;
export type WorkerConfig = ReturnType<typeof getWorkerConfig>;
export type WebConfig = ReturnType<typeof getWebConfig>;

export function getApiConfig() {
  const parsed = apiEnvSchema.parse(process.env);
  return {
    nodeEnv: parsed.NODE_ENV,
    isProduction: parsed.NODE_ENV === 'production',
    logLevel: parsed.LOG_LEVEL,
    databaseUrl: parsed.DATABASE_URL,
    redisUrl: parsed.REDIS_URL,
    port: parsed.API_PORT,
    apiBaseUrl: parsed.API_BASE_URL,
    jwtSecret: parsed.JWT_SECRET,
    cookieSecure: parsed.COOKIE_SECURE ?? parsed.NODE_ENV === 'production',
    corsOrigins: parsed.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  };
}

export function getWorkerConfig() {
  const parsed = commonEnvSchema.parse(process.env);
  return {
    nodeEnv: parsed.NODE_ENV,
    isProduction: parsed.NODE_ENV === 'production',
    logLevel: parsed.LOG_LEVEL,
    databaseUrl: parsed.DATABASE_URL,
    redisUrl: parsed.REDIS_URL
  };
}

export function getWebConfig() {
  const parsed = webEnvSchema.parse(process.env);
  return {
    apiProxyBase: parsed.NEXT_PUBLIC_API_PROXY_BASE,
    apiInternalUrl: parsed.API_INTERNAL_URL,
    restaurantName: parsed.NEXT_PUBLIC_RESTAURANT_NAME
  };
}
