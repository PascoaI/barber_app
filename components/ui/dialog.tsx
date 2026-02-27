'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Dialog({ open, children }: { open: boolean; children: React.ReactNode }) { if (!open) return null; return <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center">{children}</div>; }
export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn('w-full max-w-md rounded-2xl border border-borderc bg-surface p-4', className)}>{children}</div>; }
