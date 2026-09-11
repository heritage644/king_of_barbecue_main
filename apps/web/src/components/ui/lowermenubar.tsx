'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, LayoutGrid, ShoppingCart } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/menu', label: 'Menu', icon: LayoutGrid },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
];

export default function FloatingNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#151515] p-1.5 shadow-xl">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 font-button text-xs font-normal transition-colors ${
              isActive ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {/* Animated Orange Background Pill */}
            {isActive && (
              <motion.div
                layoutId="activePill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            {/* Icon and Label sitting above the active background */}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}