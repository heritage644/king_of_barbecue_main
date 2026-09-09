import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/#gallery', label: 'Gallery' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-background/85 backdrop-blur-xl">
      <div className="container-padded flex h-20 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
