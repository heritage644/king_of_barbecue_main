import { MarketingShell } from '@/components/store/MarketingShell';
import { CustomerLoginClient } from './customer-login-client';

export default function CustomerLoginPage() {
  return (
    <MarketingShell>
      <CustomerLoginClient />
    </MarketingShell>
  );
}
