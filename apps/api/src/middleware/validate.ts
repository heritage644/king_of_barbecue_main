import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

function removeEmptyQueryValues(query: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === '' || value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      const cleanedArray = value.filter((item) => item !== '' && item !== undefined && item !== null);
      if (cleanedArray.length > 0) cleaned[key] = cleanedArray;
      continue;
    }
    cleaned[key] = value;
  }

  return cleaned;
}

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
    const rawQuery = removeEmptyQueryValues(req.query as Record<string, unknown>);
    const result = schema.safeParse(rawQuery);

    if (!result.success) {
      console.error('❌ [validateQuery] Error:', JSON.stringify(result.error.format(), null, 2));
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.format()
      });
    }

    // Express 5 exposes req.query through a getter. Assigning to it can throw and
    // mutating it is not reliable because the getter may return a fresh object.
    // Store validated/defaulted query data on res.locals for controllers instead.
    res.locals.validatedQuery = result.data;
    next();
  };
}
