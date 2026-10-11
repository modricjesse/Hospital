import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring rounded-xs select-none',
  {
    variants: {
      variant: {
        default:
          'border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
        secondary:
          'border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300',
        destructive:
          'border border-red-300 dark:border-red-500/30 bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 font-mono',
        outline:
          'border border-zinc-300 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 bg-transparent',
        swiss:
          'border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-mono tracking-wider uppercase text-[10px]',
        verified:
          'border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono',
        warning:
          'border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono',
        cyan:
          'border border-teal-300 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-mono',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
