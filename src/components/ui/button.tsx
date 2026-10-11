import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white active:bg-zinc-950 dark:active:bg-zinc-200 border border-zinc-900 dark:border-zinc-200 shadow-xs font-semibold',
        swiss:
          'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 border border-rose-500 font-semibold tracking-wide uppercase text-[11px]',
        primary:
          'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 hover:bg-teal-500 dark:hover:bg-teal-400 active:bg-teal-700 dark:active:bg-teal-600 border border-teal-600 dark:border-teal-400 font-semibold',
        destructive:
          'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30 hover:bg-red-500/20 active:bg-red-500/30',
        outline:
          'border border-zinc-300 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700',
        secondary:
          'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white',
        ghost:
          'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100',
        link:
          'text-teal-600 dark:text-teal-400 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2 rounded-md',
        sm: 'h-7 px-2.5 rounded-xs text-[11px]',
        lg: 'h-11 px-6 rounded-md text-sm',
        icon: 'h-8 w-8 rounded-md',
        compact: 'h-6 px-2 text-[10px] rounded-xs font-mono',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
