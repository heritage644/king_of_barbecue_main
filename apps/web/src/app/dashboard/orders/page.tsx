import { MarketingShell } from '@/components/store/MarketingShell';
import { DashboardOrdersClient } from './dashboard-orders-client';

export default function DashboardOrdersPage() {
  return (
    <MarketingShell>
      <DashboardOrdersClient />
    </MarketingShell>
  );
}
