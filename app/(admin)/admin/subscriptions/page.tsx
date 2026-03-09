'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeDollarSign, CreditCard, TrendingDown, Users } from 'lucide-react';
import { getAdminSubscriptionSnapshot, type FinancePeriod } from '@/lib/analytics';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PERIOD_OPTIONS: Array<{ id: FinancePeriod; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' }
];

function asCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

export default function AdminSubscriptionsPage() {
  const [period, setPeriod] = useState<FinancePeriod>('today');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const snapshot = await getAdminSubscriptionSnapshot(period);
        if (!active) return;
        setData(snapshot);
      } catch {
        if (!active) return;
        toast('Falha ao carregar metricas de assinaturas.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [period, toast]);

  const kpis = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: 'Receita de assinaturas',
        value: asCurrency(data.totals.periodRevenue),
        hint: `${data.totals.newInPeriodCount} novas no periodo`,
        icon: BadgeDollarSign
      },
      {
        title: 'MRR',
        value: asCurrency(data.totals.mrr),
        hint: `${data.totals.activeCount} ativas`,
        icon: CreditCard
      },
      {
        title: 'ARPU',
        value: asCurrency(data.totals.arpu),
        hint: 'Receita media por assinante ativo',
        icon: Users
      },
      {
        title: 'Churn no periodo',
        value: String(data.totals.churnInPeriodCount),
        hint: `${data.totals.suspendedCount} suspensas`,
        icon: TrendingDown
      }
    ];
  }, [data]);

  const rowClass = 'flex items-center justify-between gap-3 rounded-xl border border-borderc/80 bg-slate-950/30 px-3 py-2.5';

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-slate-950/80">
        <CardHeader className="flex flex-col gap-3 border-borderc/80 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Analise de assinaturas</CardTitle>
            <p className="text-sm text-text-secondary">Visao tecnica da receita recorrente, distribuicao de planos e risco de churn.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-borderc bg-slate-950/50 p-1">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  onClick={() => setPeriod(option.id)}
                  variant={period === option.id ? 'default' : 'ghost'}
                  className="min-h-9 rounded-lg px-3 text-xs md:text-sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <Link
              href="/admin/finance"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-borderc px-3 text-sm font-semibold text-text-primary transition hover:border-primary/70 hover:bg-slate-900/40"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao financeiro
            </Link>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          {loading || !data ? (
            <div className="h-36 animate-pulse rounded-xl border border-borderc bg-slate-900/40" />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                  <article key={kpi.title} className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3">
                    <div className="mb-2 inline-flex rounded-lg border border-borderc/70 bg-slate-900/60 p-2">
                      <kpi.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs uppercase tracking-wide text-text-secondary">{kpi.title}</p>
                    <p className="text-xl font-semibold">{kpi.value}</p>
                    <p className="text-xs text-text-secondary">{kpi.hint}</p>
                  </article>
                ))}
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <article className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Planos com mais clientes</h3>
                    <small className="text-text-secondary">Base ativa + trial</small>
                  </div>
                  <div className="grid gap-2">
                    {data.topPlansBySubscribers.length ? (
                      data.topPlansBySubscribers.map((row: any) => (
                        <div key={row.name} className={rowClass}>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{row.name}</p>
                            <p className="text-xs text-text-secondary">{row.subscribers} clientes</p>
                          </div>
                          <strong className="text-sm">{asCurrency(row.revenue)}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3 text-sm text-text-secondary">Sem assinaturas para analisar.</p>
                    )}
                  </div>
                </article>

                <article className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Receita por plano</h3>
                    <small className="text-text-secondary">{data.label}</small>
                  </div>
                  <div className="grid gap-2">
                    {data.plansInPeriod.length ? (
                      data.plansInPeriod.map((row: any) => (
                        <div key={row.name} className={rowClass}>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{row.name}</p>
                            <p className="text-xs text-text-secondary">{row.subscribers} adesoes no periodo</p>
                          </div>
                          <strong className="text-sm">{asCurrency(row.revenue)}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3 text-sm text-text-secondary">Nenhuma nova assinatura no periodo selecionado.</p>
                    )}
                  </div>
                </article>
              </div>

              <article className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Assinaturas vencendo em 7 dias</h3>
                  <small className="text-text-secondary">Acompanhe para reduzir cancelamentos</small>
                </div>
                <div className="grid gap-2">
                  {data.expiringSoon.length ? (
                    data.expiringSoon.map((row: any) => (
                      <div key={row.id} className={rowClass}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{row.plan}</p>
                          <p className="text-xs text-text-secondary">Expira em {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString('pt-BR') : '--'}</p>
                        </div>
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">Atencao</span>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3 text-sm text-text-secondary">Nenhuma assinatura ativa expirando na proxima semana.</p>
                  )}
                </div>
              </article>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
