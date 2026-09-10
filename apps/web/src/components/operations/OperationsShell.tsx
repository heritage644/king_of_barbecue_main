import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '../store/Logo';
import { ClipboardList, Flame } from 'lucide-react';

export function OperationsShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-primary-foreground">
      <header className="sticky top-0 z-40 border-b border-stone-200 
      bg-background text-white shadow-sm">
        
        <div className="container-padded flex h-16 items-center justify-between gap-4">
          <Logo/>
         
          <nav className="flex items-center gap-3 text-sm font-semibold text-primary">
            <Link className="inline-flex items-center gap-2 rounded-full px-3 py-2 
            hover:bg-destructive  hover:text-white" href="/operations">
              <ClipboardList className="h-4 w-4" /> Logout
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
