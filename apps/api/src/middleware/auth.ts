import type { RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { canRoleAccess, type UserRole } from '@kob/shared-types';
import { getApiConfig } from '@kob/config';
import { AppError } from '../errors/AppError.js';

const config = getApiConfig();
export const AUTH_COOKIE_NAME = 'kob_session';
export const CART_COOKIE_NAME = 'kob_cart_id';
export const ORDER_TRACKING_COOKIE_PREFIX = 'kob_track_';

interface AuthTokenPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  fullName?: string;
}

export function createAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1_000,
    path: '/'
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/'
  });
}

export function trackingCookieName(publicOrderCode: string) {
  return `${ORDER_TRACKING_COOKIE_PREFIX}${publicOrderCode.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export function setOrderTrackingCookie(res: Response, publicOrderCode: string, token: string) {
  res.cookie(trackingCookieName(publicOrderCode), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: 14 * 24 * 60 * 60 * 1_000,
    path: '/'
  });
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const cookieToken = typeof req.cookies?.[AUTH_COOKIE_NAME] === 'string' ? req.cookies[AUTH_COOKIE_NAME] : undefined;
  const authHeader = req.header('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
  const token = cookieToken ?? bearerToken;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles,
      ...(decoded.fullName ? { fullName: decoded.fullName } : {})
    };
  } catch {
    // Invalid optional auth is ignored here; protected routes use requireAuth.
  }

  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  optionalAuth(req, _res, (error) => {
    if (error) {
      next(error);
      return;
    }
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    next();
  });
};

export function requireRole(allowedRoles: readonly UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }

    if (!canRoleAccess(req.user.roles, allowedRoles)) {
      next(AppError.forbidden());
      return;
    }

    next();
  };
}
