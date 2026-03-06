import * as React from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('w-full rounded-xl border border-borderc bg-slate-950/70 px-3 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary', className)} {...props} />;
}
