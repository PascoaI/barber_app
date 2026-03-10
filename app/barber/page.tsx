'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CircleDollarSign, Scissors, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeletons';
import { concludeBarberService, getBarberDashboardData } from '@/lib/barber-dashboard';
import { useToast } from '@/components/ui/toast';

function asCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function statusLabel(status: string) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return 'CONCLUIDO';
  if (normalized === 'confirmed') return 'CONFIRMADO';
  if (normalized === 'pending') return 'PENDENTE';
  if (normalized === 'awaiting_payment') return 'AGUARDANDO PAGAMENTO';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'CANCELADO';
  if (normalized === 'no_show') return 'NO SHOW';
  return String(status || '').toUpperCase();
}

function statusStyle(status: string) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100';
  if (normalized === 'confirmed') return 'border-sky-400/50 bg-sky-500/15 text-sky-100';
  if (normalized === 'pending') return 'border-amber-400/50 bg-amber-500/15 text-amber-100';
  if (normalized === 'awaiting_payment') return 'border-violet-400/50 bg-violet-500/15 text-violet-100';
  if (normalized === 'no_show') return 'border-rose-400/50 bg-rose-500/15 text-rose-100';
  return 'border-borderc bg-slate-950/40 text-text-secondary';
}

export default function BarberEntryPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [busyId, setBusyId] = useState('');
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(await getBarberDashboardData());
    } catch {
      toast('Falha ao carregar painel do barbeiro.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const appointments = useMemo(() => dashboard?.appointments || [], [dashboard?.appointments]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-slate-950/80">
        <CardHeader>
          <CardTitle>Painel do barbeiro</CardTitle>
          <p className="text-sm text-text-secondary">Visualize seus agendamentos, conclua atendimentos e acompanhe seus ganhos.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {loading || !dashboard ? (
            <CardSkeleton />
          ) : (
            <>
              <section className="grid gap-3">
                <h2 className="text-base font-semibold">Agendamentos vinculados a voce</h2>
                {appointments.length === 0 ? (
                  <EmptyState title="Sem agendamentos para este barbeiro" description="Quando houver novos horarios vinculados, eles aparecerao aqui." />
                ) : (
                  <div className="grid gap-2">
                    {appointments.map((row: any) => {
                      const canConclude = ['pending', 'confirmed'].includes(String(row.status || '').toLowerCase());
                      return (
                        <article key={row.id} className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3">
                          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-start">
                            <div className="grid gap-1">
                              <p className="text-sm font-semibold">{row._displayService}</p>
                              <p className="flex items-center gap-2 text-xs text-text-secondary">
                                <UserRound className="h-3.5 w-3.5" />
                                {row._displayClient}
                              </p>
                              <p className="flex items-center gap-2 text-xs text-text-secondary">
                                <CalendarClock className="h-3.5 w-3.5" />
                                {new Date(row.start_datetime).toLocaleString('pt-BR')}
                              </p>
                              <p className="text-sm font-semibold text-primary">{asCurrency(row._displayPrice)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${statusStyle(row.status)}`}>
                                {statusLabel(row.status)}
                              </span>
                              <Button
                                disabled={!canConclude || busyId === String(row.id)}
                                onClick={async () => {
                                  try {
                                    setBusyId(String(row.id));
                                    await concludeBarberService(String(row.id));
                                    toast('Servico concluido com sucesso.');
                                    await load();
                                  } catch (error: any) {
                                    toast(error?.message || 'Nao foi possivel concluir o servico.');
                                  } finally {
                                    setBusyId('');
                                  }
                                }}
                                className="min-h-10"
                              >
                                Concluir servico
                              </Button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="grid gap-3 md:grid-cols-2">
                <article className="rounded-xl border border-borderc/80 bg-slate-950/35 p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-text-secondary">
                    <CircleDollarSign className="h-4 w-4 text-primary" />
                    Ganhos de hoje
                  </p>
                  <p className="text-3xl font-extrabold">{asCurrency(Number(dashboard.earningsToday || 0))}</p>
                  <small className="text-text-secondary">Somente servicos com status CONCLUIDO.</small>
                </article>
                <article className="rounded-xl border border-borderc/80 bg-slate-950/35 p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-text-secondary">
                    <Scissors className="h-4 w-4 text-primary" />
                    Ganhos da semana
                  </p>
                  <p className="text-3xl font-extrabold">{asCurrency(Number(dashboard.earningsWeek || 0))}</p>
                  <small className="text-text-secondary">Soma da semana atual para o barbeiro logado.</small>
                </article>
              </section>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
