import { MarketingShell } from '@/components/store/MarketingShell';
import { CheckoutClient } from './checkout-client';

export default function CheckoutPage() {
  return (
    <MarketingShell>
      <CheckoutClient />
    </MarketingShell>
  );
}
