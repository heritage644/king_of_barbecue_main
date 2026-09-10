import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      console.error('❌ [validateBody] Error:', JSON.stringify(result.error.format(), null, 2));
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.format()
      });
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      console.error('❌ [validateQuery] Error:', JSON.stringify(result.error.format(), null, 2));
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.format()
      });
    }

    const parsed = result.data as Record<string, unknown>;

    for (const key of Object.keys(req.query)) {
      delete req.query[key];
    }
    Object.assign(req.query, parsed);

    next();
  };
}