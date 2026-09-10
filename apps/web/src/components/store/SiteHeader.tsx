import Link from 'next/link';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartCountBadge } from './CartCountBadge';
import { HeaderAccountLink } from './HeaderAccountLink';
import { Logo } from './Logo';

const navItems = [
  { href: '/menu', label: 'Menu' },
 
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-background/85 backdrop-blur-xl">
      <div className="container-padded flex h-20 items-center justify-between gap-4">
        {/* Logo */}
       <div className='flex '><Logo /> <h1 className='font-bold'> <span className='text-primary'>KING</span> OF <br/> BARBECUE</h1></div>

        {/* Desktop Right Actions (Original Code Unchanged) */}
        <div className="hidden items-center bg-secondary  gap-2 sm:flex">
          <HeaderAccountLink
            showLabel
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition hover:bg-secondary/70"
            iconClassName="h-4 w-4"
          />
        
          <Button asChild variant="dark">
            <Link href="/cart" aria-label="Open cart">
              <ShoppingBag className="h-4 w-4" />
              Cart
            </Link>
          </Button>
        </div>

        {/* Mobile View Actions (Matches the design in your image) */}
        <div className="flex items-center gap-3 sm:hidden">
          {/* Cart Icon with Red Badge */}
          <Link
            href="/cart"
            aria-label="Open cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white 
            text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            <ShoppingCart className="h-5 w-5" />
            <CartCountBadge
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full 
              bg-red-500 px-1 text-[11px] font-bold text-white shadow"
            />
          </Link>

          {/* User dashboard / sign-in link */}
          <HeaderAccountLink
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700
             shadow-sm transition hover:bg-gray-50 active:scale-95"
          />
        </div>
      </div>
    </header>
  );
}