'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SuperAdminShell } from '@/components/superadmin';
import { isSuperAdminSession, listOnboardingRequests, listPlatformBarbershops } from '@/services/superadmin';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [shops, setShops] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    void (async () => {
      if (!(await isSuperAdminSession())) {
        router.replace('/superadmin/login');
        return;
      }

      try {
        const [shopsRows, requestRows] = await Promise.all([
          listPlatformBarbershops(),
          listOnboardingRequests()
        ]);
        setShops(shopsRows);
        setRequests(requestRows);
      } catch {
        setShops([]);
        setRequests([]);
      }
    })();
  }, [router]);

  const stats = useMemo(() => {
    const total = shops.length;
    const active = shops.filter((row) => row.status === 'active').length;
    const inactive = shops.filter((row) => ['disabled', 'suspended'].includes(row.status)).length;
    const pending = requests.filter((row) => row.status === 'pending').length;
    return { total, active, inactive, pending };
  }, [shops, requests]);

  return (
    <SuperAdminShell title="Dashboard SuperAdmin" subtitle="Aprovacao de tenants e governanca central da plataforma.">
      <div className="grid gap-3 md:grid-cols-4">
        <article className="rounded-xl border border-borderc bg-slate-950/35 p-4">
          <small className="text-text-secondary">Tenants provisionados</small>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </article>
        <article className="rounded-xl border border-borderc bg-slate-950/35 p-4">
          <small className="text-text-secondary">Ativos</small>
          <p className="text-2xl font-semibold">{stats.active}</p>
        </article>
        <article className="rounded-xl border border-borderc bg-slate-950/35 p-4">
          <small className="text-text-secondary">Inativos</small>
          <p className="text-2xl font-semibold">{stats.inactive}</p>
        </article>
        <article className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <small className="text-amber-200">Solicitacoes pendentes</small>
          <p className="text-2xl font-semibold text-amber-100">{stats.pending}</p>
        </article>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <strong>Fila de onboarding</strong>
            <Button type="button" variant="outline" onClick={() => router.push('/superadmin/barbershops')}>
              Abrir painel completo
            </Button>
          </div>
          <div className="grid gap-3">
            {requests.slice(0, 5).map((row) => (
              <article key={row.id} className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
                <strong className="block">{row.barbershop_name}</strong>
                <small className="text-text-secondary">{row.owner_name} • {row.email}</small>
                <small className="mt-1 block text-text-secondary">Status: {row.status}</small>
              </article>
            ))}
            {!requests.length ? <small className="text-text-secondary">Nenhuma solicitacao recebida no momento.</small> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <strong>Operacoes recentes</strong>
            <Button type="button" onClick={() => router.push('/superadmin/barbershops/new')}>
              Criar tenant manualmente
            </Button>
          </div>
          <div className="grid gap-3">
            {shops.slice(0, 5).map((row) => (
              <article key={row.id} className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
                <strong className="block">{row.name}</strong>
                <small className="text-text-secondary">{row.slug || 'sem slug'} • {row.status}</small>
              </article>
            ))}
            {!shops.length ? <small className="text-text-secondary">Nenhum tenant provisionado ainda.</small> : null}
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}
