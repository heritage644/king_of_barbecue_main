import crypto from 'node:crypto';
import { nanoid } from 'nanoid';

export function generatePublicOrderCode() {
  return `ORD-${nanoid(8).toUpperCase()}`;
}

export function generateTrackingToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function constantTimeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}
