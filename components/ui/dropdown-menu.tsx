'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function DropdownMenu({ children }: { children: React.ReactNode }) { return <div className="relative">{children}</div>; }
export function DropdownMenuTrigger({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) { return <div onClick={onClick}>{children}</div>; }
export function DropdownMenuContent({ open, children, className }: { open?: boolean; children: React.ReactNode; className?: string }) { if (!open) return null; return <div className={cn('absolute right-0 mt-2 min-w-44 rounded-xl border border-borderc bg-surface p-2 grid gap-1 z-40', className)}>{children}</div>; }
export function DropdownMenuItem({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) { return <button type="button" onClick={onClick} className="text-left px-3 py-2 rounded-lg hover:bg-slate-900/50">{children}</button>; }
