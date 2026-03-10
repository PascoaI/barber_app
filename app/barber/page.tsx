'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeInfo, CalendarClock, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Scissors, UserRound, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeletons';
import { concludeBarberService, getBarberDashboardData } from '@/lib/barber-dashboard';
import { useToast } from '@/components/ui/toast';

function asCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function asDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

function asInputDate(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, days: number) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toLocalDateKey(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return asInputDate(date);
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

function StatusIcon({ status }: { status: string }) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (normalized === 'confirmed' || normalized === 'pending' || normalized === 'awaiting_payment') return <Clock3 className="h-3.5 w-3.5" />;
  if (normalized === 'no_show') return <AlertTriangle className="h-3.5 w-3.5" />;
  return <XCircle className="h-3.5 w-3.5" />;
}

export default function BarberEntryPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [busyId, setBusyId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => asInputDate(new Date()));
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
  const filteredAppointments = useMemo(
    () => appointments.filter((row: any) => toLocalDateKey(row.start_datetime) === selectedDate),
    [appointments, selectedDate]
  );

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <Card className="border-borderc/80 bg-[radial-gradient(circle_at_0%_0%,rgba(198,154,69,0.18),transparent_36%),radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.16),transparent_42%),linear-gradient(135deg,rgba(2,6,23,0.95),rgba(10,18,40,0.92))]">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/90">OPERACAO BARBER</p>
          <CardTitle className="text-2xl md:text-3xl">Agenda do dia a dia</CardTitle>
          <p className="text-sm text-text-secondary">Visualize rapidamente seus atendimentos, acompanhe status e conclua servicos sem sair da home.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {loading || !dashboard ? (
            <CardSkeleton />
          ) : (
            <>
              <section className="grid gap-3 lg:grid-cols-2">
                <article className="relative overflow-hidden rounded-2xl border border-emerald-300/45 bg-gradient-to-br from-emerald-500/20 via-emerald-500/8 to-transparent p-5 shadow-[0_16px_38px_rgba(16,185,129,0.2)]">
                  <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" aria-hidden="true" />
                  <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-100/90">
                    <CircleDollarSign className="h-4 w-4" />
                    Ganhos de hoje
                  </p>
                  <p className="text-3xl font-extrabold leading-none text-emerald-50">
                    {asCurrency(Number(dashboard.earningsToday || 0))}
                  </p>
                  <small className="text-emerald-100/80">Somente atendimentos concluidos do barbeiro logado.</small>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-sky-300/45 bg-gradient-to-br from-sky-500/20 via-sky-500/8 to-transparent p-5 shadow-[0_16px_38px_rgba(56,189,248,0.2)]">
                  <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-sky-300/20 blur-2xl" aria-hidden="true" />
                  <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-sky-100/90">
                    <Scissors className="h-4 w-4" />
                    Ganhos da semana
                  </p>
                  <p className="text-3xl font-extrabold leading-none text-sky-50">
                    {asCurrency(Number(dashboard.earningsWeek || 0))}
                  </p>
                  <small className="text-sky-100/80">Soma semanal dos servicos concluidos por voce.</small>
                </article>
              </section>

              <section className="rounded-2xl border border-borderc/80 bg-slate-950/45 p-4 shadow-[0_14px_36px_rgba(2,6,23,0.28)]">
                <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">Agenda do barbeiro</h2>
                    <p className="text-xs text-text-secondary">Cards com dados completos para leitura e acao rapida.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor="barber-agenda-date-filter">Filtrar por data</label>
                    <input
                      id="barber-agenda-date-filter"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-10 rounded-xl border border-borderc/80 bg-slate-900/65 px-3 text-sm text-text-primary outline-none transition-colors focus:border-primary/70"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-3 text-xs"
                      onClick={() => setSelectedDate(asInputDate(addDays(new Date(), -1)))}
                    >
                      Ontem
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-3 text-xs"
                      onClick={() => setSelectedDate(asInputDate(new Date()))}
                    >
                      Hoje
                    </Button>
                    <span className="rounded-full border border-borderc/80 bg-slate-900/60 px-2.5 py-1 text-xs text-text-secondary">
                      {filteredAppointments.length} de {appointments.length}
                    </span>
                  </div>
                </header>

                {filteredAppointments.length === 0 ? (
                  <EmptyState title="Sem agendamentos nesta data" description="Selecione outra data no calendario para ver os atendimentos." />
                ) : (
                  <div className="grid gap-3">
                    {filteredAppointments.map((row: any) => {
                      const canConclude = ['pending', 'confirmed'].includes(String(row.status || '').toLowerCase());
                      const appointmentDate = asDateTime(row.start_datetime);
                      const createdAt = asDateTime(row.created_at);
                      return (
                        <article key={row.id} className="rounded-2xl border border-borderc/80 bg-slate-950/55 p-4 shadow-[0_10px_26px_rgba(2,6,23,0.28)]">
                          <div className="grid gap-4">
                            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                              <div className="grid gap-2">
                                <p className="text-base font-semibold">{row._displayService}</p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                                  <UserRound className="h-3.5 w-3.5 text-primary" />
                                  Cliente: <strong className="text-text-primary">{row._displayClient}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                                  <CalendarClock className="h-3.5 w-3.5 text-primary" />
                                  Atendimento: <strong className="text-text-primary">{appointmentDate}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                  Criado em: <strong className="text-text-primary">{createdAt}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                                  <Clock3 className="h-3.5 w-3.5 text-primary" />
                                  Valor: <strong className="text-primary">{asCurrency(row._displayPrice)}</strong>
                                </p>
                                <p className="text-xs text-text-secondary">
                                  Observacoes: <strong className="text-text-primary">{row.notes ? String(row.notes) : 'Sem observacoes registradas.'}</strong>
                                </p>
                              </div>
                              <div className="flex flex-col items-start gap-2 md:items-end">
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${statusStyle(row.status)}`}>
                                  <StatusIcon status={String(row.status || '')} />
                                  {statusLabel(row.status)}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-borderc/80 bg-slate-900/50 px-2 py-1 text-[11px] text-text-secondary">
                                  <BadgeInfo className="h-3.5 w-3.5" />
                                  ID: {String(row.id || '-').slice(0, 8)}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 pt-3 md:flex-row md:items-center md:justify-between">
                              <p className="text-xs text-text-secondary">Concluir habilitado para status pendente ou confirmado.</p>
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
                                className="min-h-10 w-full bg-primary text-zinc-900 hover:bg-primary-dark md:w-auto"
                              >
                                {busyId === String(row.id) ? 'Concluindo...' : 'Concluir Servico'}
                              </Button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
