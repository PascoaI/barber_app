import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative w-10 h-10 rounded-full border border-borderc bg-slate-800 overflow-hidden grid place-items-center', className)} {...props} />;
}

type AvatarImageProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function AvatarImage({ src, alt = 'Avatar', className }: AvatarImageProps) {
  return <Image src={src} alt={alt} fill className={cn('object-cover', className)} sizes="40px" />;
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('text-xs text-text-primary', className)} {...props} />;
}
