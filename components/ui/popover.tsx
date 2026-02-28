'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Popover({ children }: { children: React.ReactNode }) { return <div className="relative">{children}</div>; }
export function PopoverTrigger({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) { return <div onClick={onClick}>{children}</div>; }
export function PopoverContent({ children, open, className }: { children: React.ReactNode; open?: boolean; className?: string }) { if (!open) return null; return <div className={cn('absolute right-0 mt-2 w-72 rounded-xl border border-borderc bg-surface p-3 shadow-soft z-40', className)}>{children}</div>; }
