import { cookies } from 'next/headers';
import type { UserDTO } from '@kob/shared-types';
import { MarketingShell } from '@/components/store/MarketingShell';
import { serverApiFetch } from '@/lib/api';
import { OrderTrackingClient } from './tracking-client';

/**
 * The session is resolved on the server so a signed-in customer never sees the
 * "create an account / sign in" prompts flash before they disappear.
 */
async function getSessionUser(): Promise<UserDTO | null> {
  try {
    const cookieHeader = (await cookies()).toString();
    const data = await serverApiFetch<{ user: UserDTO | null }>('/auth/me', {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    return data.user ?? null;
  } catch {
    return null;
  }
}

export default async function OrderTrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const [{ code }, initialUser] = await Promise.all([params, getSessionUser()]);
  return (
    <MarketingShell>
      <OrderTrackingClient publicCode={code} initialUser={initialUser} />
    </MarketingShell>
  );
}
