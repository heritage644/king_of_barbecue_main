import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', {
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-primary-foreground',
      pending: 'border-amber-200 bg-amber-100 text-amber-900',
      success: 'border-emerald-200 bg-emerald-100 text-emerald-900',
      danger: 'border-red-200 bg-red-100 text-red-900',
      progress: 'border-blue-200 bg-blue-100 text-blue-900',
      neutral: 'border-stone-200 bg-stone-100 text-stone-800',
      outline: 'border-border bg-white/60 text-foreground'
    }
  },
  defaultVariants: { variant: 'default' }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
