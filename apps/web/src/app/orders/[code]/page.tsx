import { MarketingShell } from '@/components/store/MarketingShell';
import { OrderTrackingClient } from './tracking-client';

export default async function OrderTrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <MarketingShell>
      <OrderTrackingClient publicCode={code} />
    </MarketingShell>
  );
}
