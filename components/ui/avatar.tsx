import * as React from 'react';
import { cn } from '@/lib/utils';

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('w-10 h-10 rounded-full border border-borderc bg-slate-800 overflow-hidden grid place-items-center', className)} {...props} />;
}

export function AvatarImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img className="w-full h-full object-cover" {...props} />;
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('text-xs text-text-primary', className)} {...props} />;
}
