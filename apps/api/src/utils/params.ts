import type { Request } from 'express';
import { AppError } from '../errors/AppError.js';

export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw AppError.validation(`Missing required route parameter: ${name}`);
  }
  return value;
}
