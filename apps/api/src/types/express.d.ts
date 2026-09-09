import type { UserRole } from '@kob/shared-types';

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      email: string;
      roles: UserRole[];
      fullName?: string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
