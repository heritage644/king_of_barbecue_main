import type { Metadata } from 'next';
import { MarketingShell } from '@/components/store/MarketingShell';
import { MenuClient } from './menu-client';

export const metadata: Metadata = {
  title: 'Menu — King of Barbecue',
  description: 'Browse grills, BBQ platters, chicken, fish, rice, sides and drinks from King of Barbecue.'
};

export default function MenuPage() {
  return (
    <MarketingShell>
      <MenuClient />
    </MarketingShell>
  );
}
