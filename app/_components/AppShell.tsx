'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/admin-home', label: 'Admin' },
  { href: '/client-home', label: 'Cliente' },
  { href: '/barber-home', label: 'Barbeiro' }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const hideShell = useMemo(() => pathname === '/login' || pathname === '/register', [pathname]);
  if (hideShell) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-40 border-b border-borderc bg-surface/95 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold tracking-wide">BarberPro</Link>
          <Badge>UI shadcn-style</Badge>
        </div>
        <div className="flex items-center gap-2 relative">
          <Popover>
            <Button variant="outline" className="min-h-10 px-3" onClick={() => setNotifOpen((v) => !v)}>🔔</Button>
            <PopoverContent open={notifOpen}>
              <div className="grid gap-2">
                <p className="text-sm font-medium">Notificações</p>
                <Separator />
                <p className="text-xs text-text-secondary">Sem notificações novas no momento.</p>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" className="min-h-10 px-3 md:hidden" onClick={() => setOpen(true)}>☰</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[calc(100vh-64px)]">
        <aside className="hidden md:block border-r border-borderc p-4 bg-surface/70">
          <nav className="grid gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 hover:bg-slate-900/40 transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="p-4 md:p-6">{children}</main>
      </div>

      <Sheet open={open}>
        <SheetContent>
          <div className="grid gap-3">
            <p className="font-semibold">Menu</p>
            {navItems.map((item) => (
              <Link onClick={() => setOpen(false)} key={item.href} href={item.href} className="rounded-lg px-3 py-2 hover:bg-slate-900/40 transition-colors">
                {item.label}
              </Link>
            ))}
            <Button variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
