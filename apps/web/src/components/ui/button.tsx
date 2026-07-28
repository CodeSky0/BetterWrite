import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-copy-14 font-medium transition-all duration-fast ease-yohaku disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white hover:bg-accent-hover dark:text-neutral-1',
        secondary:
          'bg-neutral-2 text-neutral-10 ring-1 ring-border hover:bg-neutral-3 hover:ring-neutral-4',
        ghost: 'text-neutral-8 hover:bg-neutral-2 hover:text-neutral-10 hover:bg-neutral-2/80',
        outline: 'ring-1 ring-border bg-transparent hover:bg-neutral-2 hover:ring-accent/50',
        destructive: 'bg-error text-white hover:bg-error/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-label-12',
        lg: 'h-12 px-6 text-copy-16',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {loading ? <span className="opacity-70">{children}</span> : children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
