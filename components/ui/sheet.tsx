'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Sheet({ open, children }: { open: boolean; children: React.ReactNode }) { if (!open) return null; return <>{children}</>; }
export function SheetContent({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn('fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-borderc p-4 shadow-soft', className)}>{children}</div>; }
