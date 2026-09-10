import Link from 'next/link';
import { ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/#gallery', label: 'Gallery' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' }
];

export function SiteHeader({ cartCount = 2 }: { cartCount?: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-background/85 backdrop-blur-xl">
      <div className="container-padded flex h-20 items-center justify-between gap-4">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Actions (Original Code Unchanged) */}
        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/operations/login">Staff</Link>
          </Button>
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
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center
               rounded-full bg-red-500 text-[11px] font-bold text-white shadow">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User/Staff Profile Link */}
          <Link
            href="/operations/login"
            aria-label="User account"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}