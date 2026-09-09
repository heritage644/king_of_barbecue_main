import Link from 'next/link';
import { Flame } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="King of Barbecue home">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
        <Flame className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-black uppercase tracking-[0.28em] text-primary">King</span>
        <span className="block text-lg font-black text-charcoal">of Barbecue</span>
      </span>
    </Link>
  );
}
