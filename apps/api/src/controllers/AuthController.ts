import type { Request, Response } from 'express';
import { authService } from '../services/AuthService.js';
import { clearAuthCookie, createAuthToken, setAuthCookie, trackingCookieName } from '../middleware/auth.js';

export class AuthController {
  async login(req: Request, res: Response) {
    const user = await authService.login(req.body);
    setAuthCookie(res, createAuthToken({ sub: user.id, email: user.email, roles: user.roles, fullName: user.fullName }));
    res.json({ user });
  }

  async logout(_req: Request, res: Response) {
    clearAuthCookie(res);
    res.status(204).send();
  }

  async me(req: Request, res: Response) {
    res.json({ user: req.user ?? null });
  }

  async createAccountFromGuest(req: Request, res: Response) {
    const cookieName = trackingCookieName(req.body.publicOrderCode);
    const trackingToken = typeof req.cookies?.[cookieName] === 'string' ? req.cookies[cookieName] : undefined;
    const user = await authService.createAccountFromGuest({ ...req.body, trackingToken });
    setAuthCookie(res, createAuthToken({ sub: user.id, email: user.email, roles: user.roles, fullName: user.fullName }));
    res.status(201).json({ user });
  }
}

export const authController = new AuthController();
