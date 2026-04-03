import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  asChild?: boolean;
};

const variants: Record<Variant, string> = {
  default: 'bg-primary text-zinc-900 hover:brightness-95',
  secondary: 'border border-borderc bg-surface text-text-primary hover:border-primary/70',
  outline: 'border border-borderc bg-transparent text-text-primary hover:bg-surface/40',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface/30',
  destructive: 'bg-red-500/90 text-white hover:bg-red-500'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', asChild = false, children, ...props },
  ref
) {
  const mergedClassName = cn('inline-flex items-center justify-center rounded-xl px-4 min-h-11 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60', variants[variant], className);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(mergedClassName, (children as React.ReactElement<any>).props.className)
    });
  }

  return (
    <button
      ref={ref}
      className={mergedClassName}
      {...props}
    >
      {children}
    </button>
  );
});
