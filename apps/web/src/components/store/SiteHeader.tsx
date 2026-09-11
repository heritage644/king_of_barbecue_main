import Link from 'next/link';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartCountBadge } from './CartCountBadge';
import { HeaderAccountLink } from './HeaderAccountLink';
import { Logo } from './Logo';

/** Section anchors on the landing page + the two app entry points. */
const navItems = [
  { href: '/menu', label: 'Menu' },
  { href: '/#gallery', label: 'Gallery' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-background/85 backdrop-blur-xl">
      <div className="container-padded flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          <p className="hidden font-heading text-base font-semibold uppercase leading-[1.05] tracking-[0.1em] sm:block">
            <span className="text-primary">King</span> of
            <br />
            Barbecue
          </p>
        </div>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 font-button text-sm font-normal text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 sm:flex">
          <HeaderAccountLink
            showLabel
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 font-button text-sm font-normal transition hover:bg-secondary/70"
            iconClassName="h-4 w-4"
          />
          <Button asChild variant="dark">
            <Link href="/cart" aria-label="Open cart">
              <ShoppingBag className="h-4 w-4" />
              Cart
            </Link>
          </Button>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-3 sm:hidden">
          <Link
            href="/menu"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 font-button text-sm font-normal text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            Menu
          </Link>
          <Link
            href="/cart"
            aria-label="Open cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            <ShoppingCart className="h-5 w-5" />
            <CartCountBadge className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 font-button text-[11px] font-normal text-white shadow" />
          </Link>
          <HeaderAccountLink className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95" />
        </div>
      </div>
    </header>
  );
}
