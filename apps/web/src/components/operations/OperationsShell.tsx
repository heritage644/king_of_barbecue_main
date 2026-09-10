import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '../store/Logo';
import { ClipboardList, Flame } from 'lucide-react';
import { OperationsLogoutButton } from './OperationsLogoutButton';

export function OperationsShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-primary-foreground">
      <header className="sticky top-0 z-40 border-b border-stone-200 
      bg-background text-white shadow-sm">
        
        <div className="container-padded flex h-16 items-center justify-between gap-4">
          <Logo/>
          <nav className="flex items-center gap-3 text-sm font-semibold text-primary">
            <OperationsLogoutButton />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
