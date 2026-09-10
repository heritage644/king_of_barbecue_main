'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import type { UserDTO } from '@kob/shared-types';
import { apiFetch } from '@/lib/api';

export function HeaderAccountLink({
  className,
  iconClassName = 'h-5 w-5',
  showLabel = false
}: {
  className: string;
  iconClassName?: string;
  showLabel?: boolean;
}) {
  const [href, setHref] = useState('/login');
  const [label, setLabel] = useState(showLabel ? 'Sign in' : 'User account');

  useEffect(() => {
    let mounted = true;
    apiFetch<{ user: UserDTO | null }>('/auth/me')
      .then((data) => {
        if (!mounted) return;
        if (data.user) {
          setHref('/dashboard/orders');
          setLabel(showLabel ? 'Dashboard' : 'User dashboard');
        } else {
          setHref('/login');
          setLabel(showLabel ? 'Sign in' : 'Sign in to user dashboard');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setHref('/login');
        setLabel(showLabel ? 'Sign in' : 'Sign in to user dashboard');
      });

    return () => {
      mounted = false;
    };
  }, [showLabel]);

  return (
    <Link href={href} aria-label={label} className={className}>
      <User className={iconClassName} />
      {showLabel ? <span>{label}</span> : null}
    </Link>
  );
}
