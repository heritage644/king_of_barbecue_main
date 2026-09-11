import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';
import { StoreAvailabilityBanner } from './StoreAvailabilityBanner';
import { SiteHeader } from './SiteHeader';

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <StoreAvailabilityBanner />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
