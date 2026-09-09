import { MarketingShell } from '@/components/store/MarketingShell';
import { CartClient } from './cart-client';

export default function CartPage() {
  return (
    <MarketingShell>
      <CartClient />
    </MarketingShell>
  );
}
