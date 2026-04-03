'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

type TenantPayload = {
  ok: boolean;
  tenant?: { id: string; name: string; slug: string; status: string };
  settings?: { barbershop_name: string };
  stats?: {
    team_count: number;
    services_count: number;
    appointments_count: number;
    estimated_revenue: number;
  };
};

type ReportsPayload = {
  ok: boolean;
  estimatedRevenue: number;
  topServices: Array<{ name: string; total: number }>;
  rows: Array<{ id: string; status: string; appointment_date: string }>;
};

export default function AdminHomePage() {
  const { toast } = useToast();
  const [tenant, setTenant] = useState<TenantPayload | null>(null);
  const [reports, setReports] = useState<ReportsPayload | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [tenantResponse, reportsResponse] = await Promise.all([
          fetch('/api/admin/tenant', { cache: 'no-store' }),
          fetch('/api/admin/reports', { cache: 'no-store' })
        ]);

        const tenantJson = await tenantResponse.json().catch(() => ({}));
        const reportsJson = await reportsResponse.json().catch(() => ({}));

        if (!tenantResponse.ok || !tenantJson?.ok) {
          throw new Error(tenantJson?.message || 'Falha ao carregar dashboard do tenant.');
        }
        if (!reportsResponse.ok || !reportsJson?.ok) {
          throw new Error(reportsJson?.message || 'Falha ao carregar relatorios.');
        }

        setTenant(tenantJson);
        setReports(reportsJson);
      } catch (error: any) {
        toast(error?.message || 'Falha ao carregar dashboard admin.');
      }
    })();
  }, [toast]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <Card className="border-borderc/80 bg-gradient-to-r from-slate-950/80 via-slate-900/70 to-slate-950/80">
        <CardHeader>
          <CardTitle>{tenant?.settings?.barbershop_name || 'Dashboard do Tenant'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <article className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
              <small className="text-text-secondary">Tenant</small>
              <p className="text-xl font-semibold">{tenant?.tenant?.slug || '...'}</p>
            </article>
            <article className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
              <small className="text-text-secondary">Equipe</small>
              <p className="text-xl font-semibold">{tenant?.stats?.team_count ?? 0}</p>
            </article>
            <article className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
              <small className="text-text-secondary">Servicos</small>
              <p className="text-xl font-semibold">{tenant?.stats?.services_count ?? 0}</p>
            </article>
            <article className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
              <small className="text-text-secondary">Receita estimada</small>
              <p className="text-xl font-semibold">R$ {Number(reports?.estimatedRevenue || tenant?.stats?.estimated_revenue || 0).toFixed(2)}</p>
            </article>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/admin/settings">Configurar tenant</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/barbers">Gerenciar equipe</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/services">Gerenciar servicos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-borderc/80 bg-slate-950/70">
          <CardHeader>
            <CardTitle>Agendamentos recentes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(reports?.rows || []).slice(0, 8).map((row) => (
              <article key={row.id} className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
                <strong className="block">{new Date(row.appointment_date).toLocaleString('pt-BR')}</strong>
                <small className="text-text-secondary">Status: {row.status}</small>
              </article>
            ))}
            {!reports?.rows?.length ? <small className="text-text-secondary">Nenhum agendamento encontrado para o tenant.</small> : null}
          </CardContent>
        </Card>

        <Card className="border-borderc/80 bg-slate-950/70">
          <CardHeader>
            <CardTitle>Servicos mais utilizados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(reports?.topServices || []).map((item) => (
              <article key={item.name} className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
                <strong className="block">{item.name}</strong>
                <small className="text-text-secondary">{item.total} agendamentos no recorte atual</small>
              </article>
            ))}
            {!reports?.topServices?.length ? <small className="text-text-secondary">Sem dados suficientes para compor ranking de servicos.</small> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
