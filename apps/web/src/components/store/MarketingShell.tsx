import type { ReactNode } from 'react';
import { StoreAvailabilityBanner } from './StoreAvailabilityBanner';
import { SiteHeader } from './SiteHeader';

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <StoreAvailabilityBanner />
      {children}
    </div>
  );
}
