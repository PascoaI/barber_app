'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

type Ctx = { value: string; setValue: (v: string) => void };
const TabsCtx = React.createContext<Ctx | null>(null);

export function Tabs({ defaultValue, children, className }: { defaultValue: string; children: React.ReactNode; className?: string }) {
  const [value, setValue] = React.useState(defaultValue);
  return <TabsCtx.Provider value={{ value, setValue }}><div className={cn('grid gap-4', className)}>{children}</div></TabsCtx.Provider>;
}

export function TabsList({ children, className }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('inline-flex rounded-xl border border-borderc p-1 bg-slate-900/40', className)}>{children}</div>; }
export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsCtx); if (!ctx) return null;
  const active = ctx.value === value;
  return <button type="button" onClick={() => ctx.setValue(value)} className={cn('px-3 py-1.5 rounded-lg text-sm', active ? 'bg-primary text-zinc-900' : 'text-text-secondary', className)}>{children}</button>;
}
export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsCtx); if (!ctx || ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}
