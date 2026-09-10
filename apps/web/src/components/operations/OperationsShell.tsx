import type { ReactNode } from 'react';
import Link from 'next/link';
import { ClipboardList, Flame } from 'lucide-react';
import { OperationsLogoutButton } from './OperationsLogoutButton';

export function OperationsShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4eee6]">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-charcoal text-white shadow-sm">
        <div className="container-padded flex h-16 items-center justify-between gap-4">
          <Link href="/operations" className="flex items-center gap-3 font-black">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><Flame className="h-5 w-5" /></span>
            Operations
          </Link>
          <nav className="flex items-center gap-3 text-sm font-semibold text-white/75">
            <Link className="inline-flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10 hover:text-white" href="/operations">
              <ClipboardList className="h-4 w-4" /> Board
            </Link>
            <Link className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white" href="/">Storefront</Link>
            <OperationsLogoutButton />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
