'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarRange, CircleDollarSign, Scissors, Users } from 'lucide-react';
import { getAdminFinanceSnapshot, getAdminSubscriptionSnapshot, type FinancePeriod } from '@/lib/analytics';
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

function asPct(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export default function AdminFinancePage() {
  const [period, setPeriod] = useState<FinancePeriod>('today');
  const [loading, setLoading] = useState(true);
  const [finance, setFinance] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [financeData, subscriptionData] = await Promise.all([
          getAdminFinanceSnapshot(period),
          getAdminSubscriptionSnapshot(period)
        ]);
        if (!active) return;
        setFinance(financeData);
        setSubscriptions(subscriptionData);
      } catch {
        if (!active) return;
        toast('Falha ao carregar o painel financeiro.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [period, toast]);

  const kpis = useMemo(() => {
    if (!finance || !subscriptions) return [];
    return [
      {
        title: 'Faturamento concluido',
        value: asCurrency(finance.totals.completedRevenue),
        hint: `Servicos concluidos (${finance.label})`,
        icon: CircleDollarSign
      },
      {
        title: 'Ticket medio',
        value: asCurrency(finance.totals.ticketAverage),
        hint: `${finance.totals.completedCount} atendimentos concluidos`,
        icon: Scissors
      },
      {
        title: 'Cancelamentos',
        value: asPct(finance.totals.cancellationRate),
        hint: `${finance.totals.canceledCount} no periodo`,
        icon: CalendarRange
      },
      {
        title: 'Receita em aberto',
        value: asCurrency(finance.totals.expectedRevenue),
        hint: `${finance.totals.queueCount} agendamentos em fila`,
        icon: CalendarRange
      },
      {
        title: 'Assinaturas no periodo',
        value: asCurrency(subscriptions.totals.periodRevenue),
        hint: `${subscriptions.totals.newInPeriodCount} novas assinaturas`,
        icon: Users
      },
      {
        title: 'MRR atual',
        value: asCurrency(subscriptions.totals.mrr),
        hint: `${subscriptions.totals.activeCount} assinantes ativos`,
        icon: CircleDollarSign
      }
    ];
  }, [finance, subscriptions]);

  const listItemClass = 'flex items-center justify-between gap-3 rounded-xl border border-borderc/80 bg-slate-950/30 px-3 py-2.5';
  const barClass = 'h-1.5 rounded-full bg-primary/80';

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-slate-950/80">
        <CardHeader className="flex flex-col gap-3 border-borderc/80 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Financeiro administrativo</CardTitle>
            <p className="text-sm text-text-secondary">Analise de faturamento por servicos concluidos e desempenho de assinaturas.</p>
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
              href="/admin/subscriptions"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-borderc px-3 text-sm font-semibold text-text-primary transition hover:border-primary/70 hover:bg-slate-900/40"
            >
              Ver assinaturas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {loading || !finance || !subscriptions ? (
            <div className="h-36 animate-pulse rounded-xl border border-borderc bg-slate-900/40" />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    <h3 className="font-semibold">Receita por barbeiro</h3>
                    <small className="text-text-secondary">Top do periodo</small>
                  </div>
                  <div className="grid gap-2">
                    {finance.byBarber.length ? (
                      finance.byBarber.map((row: any) => (
                        <div key={row.name} className={listItemClass}>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{row.name}</p>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800/80">
                              <div className={barClass} style={{ width: `${Math.max(8, row.percentage || 0)}%` }} />
                            </div>
                          </div>
                          <strong className="text-sm">{asCurrency(row.amount)}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3 text-sm text-text-secondary">Sem faturamento por barbeiro neste periodo.</p>
                    )}
                  </div>
                </article>

                <article className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Receita por servico</h3>
                    <small className="text-text-secondary">Servicos concluidos</small>
                  </div>
                  <div className="grid gap-2">
                    {finance.byService.length ? (
                      finance.byService.map((row: any) => (
                        <div key={row.name} className={listItemClass}>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{row.name}</p>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800/80">
                              <div className={barClass} style={{ width: `${Math.max(8, row.percentage || 0)}%` }} />
                            </div>
                          </div>
                          <strong className="text-sm">{asCurrency(row.amount)}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3 text-sm text-text-secondary">Sem receita por servico neste periodo.</p>
                    )}
                  </div>
                </article>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <article className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Desempenho diario</h3>
                    <small className="text-text-secondary">{finance.label}</small>
                  </div>
                  <div className="grid gap-2">
                    {finance.daily.length ? (
                      finance.daily.map((row: any) => (
                        <div key={row.key} className={listItemClass}>
                          <span className="text-sm text-text-secondary">{row.label}</span>
                          <div className="mx-2 h-1.5 flex-1 rounded-full bg-slate-800/80">
                            <div className={barClass} style={{ width: `${Math.max(6, row.percentage || 0)}%` }} />
                          </div>
                          <strong className="text-sm">{asCurrency(row.amount)}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3 text-sm text-text-secondary">Sem movimentacao diaria para exibir.</p>
                    )}
                  </div>
                </article>

                <article className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Resumo de assinaturas</h3>
                    <small className="text-text-secondary">{subscriptions.label}</small>
                  </div>
                  <div className="grid gap-2">
                    <div className={listItemClass}>
                      <span className="text-sm text-text-secondary">Receita no periodo</span>
                      <strong>{asCurrency(subscriptions.totals.periodRevenue)}</strong>
                    </div>
                    <div className={listItemClass}>
                      <span className="text-sm text-text-secondary">Assinantes ativos</span>
                      <strong>{subscriptions.totals.activeCount}</strong>
                    </div>
                    <div className={listItemClass}>
                      <span className="text-sm text-text-secondary">Em trial</span>
                      <strong>{subscriptions.totals.trialCount}</strong>
                    </div>
                    <div className={listItemClass}>
                      <span className="text-sm text-text-secondary">Suspensas</span>
                      <strong>{subscriptions.totals.suspendedCount}</strong>
                    </div>
                  </div>
                  <Link
                    href="/admin/subscriptions"
                    className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-zinc-900 transition hover:brightness-95"
                  >
                    Abrir analise de assinaturas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
