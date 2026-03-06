'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SuperAdminShell } from '@/components/superadmin';
import { isSuperAdminSession, listPlatformBarbershops } from '@/services/superadmin';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState(() => listPlatformBarbershops());

  useEffect(() => {
    if (!isSuperAdminSession()) router.replace('/superadmin/login');
    setRows(listPlatformBarbershops());
  }, [router]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === 'active').length;
    const disabled = rows.filter((r) => r.status === 'disabled').length;
    return { total, active, disabled };
  }, [rows]);

  return (
    <SuperAdminShell title="Dashboard SuperAdmin" subtitle="Controle central da plataforma multi-barbearia.">
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-borderc bg-slate-950/35 p-4">
          <small className="text-text-secondary">Barbearias</small>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </article>
        <article className="rounded-xl border border-borderc bg-slate-950/35 p-4">
          <small className="text-text-secondary">Ativas</small>
          <p className="text-2xl font-semibold">{stats.active}</p>
        </article>
        <article className="rounded-xl border border-borderc bg-slate-950/35 p-4">
          <small className="text-text-secondary">Desativadas</small>
          <p className="text-2xl font-semibold">{stats.disabled}</p>
        </article>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => router.push('/superadmin/barbershops')}>Gerenciar barbearias</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/superadmin/barbershops/new')}>Adicionar barbearia</Button>
      </div>
    </SuperAdminShell>
  );
}
