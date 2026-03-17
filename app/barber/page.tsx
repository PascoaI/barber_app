'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeInfo, CalendarClock, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Scissors, UserRound, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeletons';
import {
  getBarberAppointmentClientContext,
  getBarberDashboardData,
  getOperationalStatusLabel,
  rescheduleBarberAppointment,
  signalBarberAppointmentDelay,
  transferBarberAppointment,
  updateBarberAppointmentStatus,
  type BarberAppointmentRow
} from '@/lib/barber-dashboard';
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

function toDatetimeLocalInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
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

function statusStyle(status: string) {
  const normalized = String(status || '').toLowerCase();
  if (['awaiting_payment', 'pending', 'confirmed'].includes(normalized)) return 'border-sky-400/50 bg-sky-500/15 text-sky-100';
  if (normalized === 'in_progress') return 'border-amber-400/50 bg-amber-500/15 text-amber-100';
  if (normalized === 'completed') return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100';
  if (normalized === 'no_show') return 'border-rose-400/50 bg-rose-500/15 text-rose-100';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'border-zinc-400/50 bg-zinc-500/15 text-zinc-100';
  return 'border-borderc bg-slate-950/40 text-text-secondary';
}

function StatusIcon({ status }: { status: string }) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (normalized === 'in_progress') return <Scissors className="h-3.5 w-3.5" />;
  if (['awaiting_payment', 'pending', 'confirmed'].includes(normalized)) return <Clock3 className="h-3.5 w-3.5" />;
  if (normalized === 'no_show') return <AlertTriangle className="h-3.5 w-3.5" />;
  return <XCircle className="h-3.5 w-3.5" />;
}

function parseIso(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

export default function BarberEntryPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [busyKey, setBusyKey] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => asInputDate(new Date()));
  const { toast } = useToast();

  const [reasonModal, setReasonModal] = useState<{ open: boolean; row: BarberAppointmentRow | null; toStatus: 'no_show' | 'canceled' | null; reason: string }>({
    open: false,
    row: null,
    toStatus: null,
    reason: ''
  });
  const [delayModal, setDelayModal] = useState<{ open: boolean; row: BarberAppointmentRow | null; minutes: string; reason: string }>({
    open: false,
    row: null,
    minutes: '10',
    reason: ''
  });
  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; row: BarberAppointmentRow | null; datetime: string }>({
    open: false,
    row: null,
    datetime: ''
  });
  const [transferModal, setTransferModal] = useState<{ open: boolean; row: BarberAppointmentRow | null; toBarberId: string; datetime: string }>({
    open: false,
    row: null,
    toBarberId: '',
    datetime: ''
  });
  const [contextModal, setContextModal] = useState<{ open: boolean; row: BarberAppointmentRow | null; loading: boolean; context: any | null }>({
    open: false,
    row: null,
    loading: false,
    context: null
  });
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

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

  const appointments = useMemo(() => (dashboard?.appointments || []) as BarberAppointmentRow[], [dashboard?.appointments]);
  const barberOptions = useMemo(() => (dashboard?.barberOptions || []) as Array<{ id: string; name: string }>, [dashboard?.barberOptions]);

  const filteredAppointments = useMemo(
    () => appointments.filter((row) => toLocalDateKey(row.start_datetime) === selectedDate),
    [appointments, selectedDate]
  );

  const runAction = useCallback(async (key: string, fn: () => Promise<any>, successMessage: string) => {
    try {
      setBusyKey(key);
      await fn();
      toast(successMessage);
      await load();
    } catch (error: any) {
      toast(error?.message || 'Falha ao executar acao.');
    } finally {
      setBusyKey('');
    }
  }, [load, toast]);

  const openContext = async (row: BarberAppointmentRow) => {
    setContextModal({ open: true, row, loading: true, context: null });
    try {
      const context = await getBarberAppointmentClientContext(String(row.id));
      setContextModal({ open: true, row, loading: false, context });
    } catch (error: any) {
      setContextModal({ open: true, row, loading: false, context: null });
      toast(error?.message || 'Nao foi possivel carregar contexto do cliente.');
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <Card className="border-borderc/80 bg-[radial-gradient(circle_at_0%_0%,rgba(198,154,69,0.18),transparent_36%),radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.16),transparent_42%),linear-gradient(135deg,rgba(2,6,23,0.95),rgba(10,18,40,0.92))]">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/90">OPERACAO BARBER</p>
          <CardTitle className="text-2xl md:text-3xl">Agenda do dia a dia</CardTitle>
          <p className="text-sm text-text-secondary">Home centrada na agenda com controle operacional completo do atendimento.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {loading || !dashboard ? (
            <CardSkeleton />
          ) : (
            <>
              <section className="grid gap-3 lg:grid-cols-2">
                <article className="relative overflow-hidden rounded-2xl border border-emerald-300/45 bg-gradient-to-br from-emerald-500/20 via-emerald-500/8 to-transparent p-5 shadow-[0_16px_38px_rgba(16,185,129,0.2)]">
                  <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-100/90">
                    <CircleDollarSign className="h-4 w-4" />
                    Ganhos de hoje
                  </p>
                  <p className="text-3xl font-extrabold leading-none text-emerald-50">{asCurrency(Number(dashboard.earningsToday || 0))}</p>
                  <small className="text-emerald-100/80">Somente atendimentos concluidos do barbeiro logado.</small>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-sky-300/45 bg-gradient-to-br from-sky-500/20 via-sky-500/8 to-transparent p-5 shadow-[0_16px_38px_rgba(56,189,248,0.2)]">
                  <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-sky-100/90">
                    <Scissors className="h-4 w-4" />
                    Ganhos da semana
                  </p>
                  <p className="text-3xl font-extrabold leading-none text-sky-50">{asCurrency(Number(dashboard.earningsWeek || 0))}</p>
                  <small className="text-sky-100/80">Soma semanal dos servicos concluidos por voce.</small>
                </article>
              </section>

              <section className="rounded-2xl border border-borderc/80 bg-slate-950/45 p-4 shadow-[0_14px_36px_rgba(2,6,23,0.28)]">
                <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">Agenda do barbeiro</h2>
                    <p className="text-xs text-text-secondary">Acoes operacionais completas no proprio card do atendimento.</p>
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
                    <Button type="button" variant="outline" className="h-10 px-3 text-xs" onClick={() => setSelectedDate(asInputDate(new Date()))}>Hoje</Button>
                    <Button type="button" variant="outline" className="h-10 px-3 text-xs" onClick={() => setSelectedDate(asInputDate(addDays(new Date(), -1)))}>Ontem</Button>
                    <span className="rounded-full border border-borderc/80 bg-slate-900/60 px-2.5 py-1 text-xs text-text-secondary">{filteredAppointments.length} de {appointments.length}</span>
                  </div>
                </header>

                {filteredAppointments.length === 0 ? (
                  <EmptyState title="Sem agendamentos nesta data" description="Selecione outra data no calendario para ver os atendimentos." />
                ) : (
                  <div className="grid gap-3">
                    {filteredAppointments.map((row) => {
                      const rowId = String(row.id);
                      const showMoreActions = openActionsId === rowId;
                      const status = String(row.status || '').toLowerCase();
                      const canStart = ['awaiting_payment', 'pending', 'confirmed'].includes(status);
                      const canConclude = ['in_progress', 'pending', 'confirmed'].includes(status);
                      const canNoShow = ['awaiting_payment', 'pending', 'confirmed'].includes(status);
                      const canCancel = ['awaiting_payment', 'pending', 'confirmed', 'in_progress'].includes(status);
                      const canDelay = ['awaiting_payment', 'pending', 'confirmed', 'in_progress'].includes(status);
                      const canReschedule = ['awaiting_payment', 'pending', 'confirmed', 'no_show'].includes(status);
                      const canTransfer = ['awaiting_payment', 'pending', 'confirmed', 'in_progress'].includes(status);

                      return (
                        <article key={row.id} className="rounded-2xl border border-borderc/80 bg-slate-950/55 p-4 shadow-[0_10px_26px_rgba(2,6,23,0.28)]">
                          <div className="grid gap-4">
                            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                              <div className="grid gap-2">
                                <p className="text-base font-semibold">{row._displayService}</p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary"><UserRound className="h-3.5 w-3.5 text-primary" />Cliente: <strong className="text-text-primary">{row._displayClient}</strong></p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary"><CalendarClock className="h-3.5 w-3.5 text-primary" />Atendimento: <strong className="text-text-primary">{asDateTime(row.start_datetime)}</strong></p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary"><CalendarDays className="h-3.5 w-3.5 text-primary" />Criado em: <strong className="text-text-primary">{asDateTime(row.created_at)}</strong></p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary"><Clock3 className="h-3.5 w-3.5 text-primary" />Valor: <strong className="text-primary">{asCurrency(row._displayPrice)}</strong></p>
                                <p className="text-xs text-text-secondary">Observacoes: <strong className="text-text-primary">{row.notes ? String(row.notes) : 'Sem observacoes registradas.'}</strong></p>
                                {row.status_reason ? <p className="text-xs text-amber-200/90">Justificativa: {String(row.status_reason)}</p> : null}
                                {Number(row.delay_minutes || 0) > 0 ? <p className="text-xs text-amber-200/90">Atraso sinalizado: {Number(row.delay_minutes)} min{row.delay_reason ? ` - ${String(row.delay_reason)}` : ''}</p> : null}
                              </div>
                              <div className="flex flex-col items-start gap-2 md:items-end">
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${statusStyle(status)}`}>
                                  <StatusIcon status={status} />
                                  {getOperationalStatusLabel(status)}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-borderc/80 bg-slate-900/50 px-2 py-1 text-[11px] text-text-secondary">
                                  <BadgeInfo className="h-3.5 w-3.5" />
                                  ID: {String(row.id || '-').slice(0, 8)}
                                </span>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                              <Button
                                type="button"
                                disabled={!canStart || busyKey === `start:${row.id}`}
                                onClick={() => runAction(`start:${row.id}`, () => updateBarberAppointmentStatus({ appointmentId: String(row.id), toStatus: 'in_progress' }), 'Atendimento iniciado.')}
                              >
                                {busyKey === `start:${row.id}` ? 'Iniciando...' : 'Iniciar'}
                              </Button>
                              <Button
                                type="button"
                                disabled={!canConclude || busyKey === `complete:${row.id}`}
                                onClick={() => runAction(`complete:${row.id}`, () => updateBarberAppointmentStatus({ appointmentId: String(row.id), toStatus: 'completed' }), 'Servico concluido com sucesso.')}
                              >
                                {busyKey === `complete:${row.id}` ? 'Concluindo...' : 'Concluir'}
                              </Button>
                              <div className="relative">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setOpenActionsId((current) => (current === rowId ? null : rowId))}
                                >
                                  {showMoreActions ? 'Ocultar acoes' : 'Mais acoes'}
                                </Button>
                                {showMoreActions ? (
                                  <div className="absolute right-0 bottom-[calc(100%+0.45rem)] z-30 grid w-[min(12rem,calc(100vw-2.5rem))] gap-2 rounded-xl border border-borderc/80 bg-slate-950/95 p-2 shadow-[0_16px_30px_rgba(2,6,23,0.36)]">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={!canNoShow}
                                onClick={() => {
                                  setOpenActionsId(null);
                                  setReasonModal({ open: true, row, toStatus: 'no_show', reason: '' });
                                }}
                              >
                                Marcar no-show
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={!canCancel}
                                onClick={() => {
                                  setOpenActionsId(null);
                                  setReasonModal({ open: true, row, toStatus: 'canceled', reason: '' });
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={!canDelay}
                                onClick={() => {
                                  setOpenActionsId(null);
                                  setDelayModal({ open: true, row, minutes: String(row.delay_minutes || 10), reason: row.delay_reason || '' });
                                }}
                              >
                                Sinalizar atraso
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={!canReschedule}
                                onClick={() => {
                                  setOpenActionsId(null);
                                  setRescheduleModal({ open: true, row, datetime: toDatetimeLocalInput(row.start_datetime) });
                                }}
                              >
                                Remarcar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={!canTransfer}
                                onClick={() => {
                                  setOpenActionsId(null);
                                  setTransferModal({ open: true, row, toBarberId: '', datetime: '' });
                                }}
                              >
                                Transferir
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setOpenActionsId(null);
                                  void openContext(row);
                                }}
                              >
                                Contexto cliente
                              </Button>
                                  </div>
                                ) : null}
                              </div>
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

      <Dialog open={reasonModal.open}>
        <DialogContent className="max-w-md border-borderc/80 bg-slate-950">
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold">{reasonModal.toStatus === 'no_show' ? 'Registrar no-show' : 'Registrar cancelamento'}</h3>
            <p className="text-sm text-text-secondary">Informe a justificativa para atualizar o status do atendimento.</p>
            <Input
              placeholder="Ex.: cliente avisou que nao viria"
              value={reasonModal.reason}
              onChange={(e) => setReasonModal((current) => ({ ...current, reason: e.target.value }))}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => setReasonModal({ open: false, row: null, toStatus: null, reason: '' })}>Fechar</Button>
              <Button
                type="button"
                disabled={!reasonModal.row || !reasonModal.toStatus || !String(reasonModal.reason || '').trim() || busyKey === `reason:${reasonModal.row?.id || ''}`}
                onClick={() => {
                  if (!reasonModal.row || !reasonModal.toStatus) return;
                  const reason = String(reasonModal.reason || '').trim();
                  void runAction(
                    `reason:${reasonModal.row.id}`,
                    () => updateBarberAppointmentStatus({ appointmentId: String(reasonModal.row?.id), toStatus: reasonModal.toStatus!, reason }),
                    reasonModal.toStatus === 'no_show' ? 'No-show registrado.' : 'Cancelamento registrado.'
                  );
                  setReasonModal({ open: false, row: null, toStatus: null, reason: '' });
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={delayModal.open}>
        <DialogContent className="max-w-md border-borderc/80 bg-slate-950">
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold">Sinalizar atraso</h3>
            <Input
              type="number"
              min={1}
              max={240}
              value={delayModal.minutes}
              onChange={(e) => setDelayModal((current) => ({ ...current, minutes: e.target.value }))}
            />
            <Input
              placeholder="Motivo do atraso (opcional)"
              value={delayModal.reason}
              onChange={(e) => setDelayModal((current) => ({ ...current, reason: e.target.value }))}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => setDelayModal({ open: false, row: null, minutes: '10', reason: '' })}>Fechar</Button>
              <Button
                type="button"
                disabled={!delayModal.row || Number(delayModal.minutes || 0) <= 0 || busyKey === `delay:${delayModal.row?.id || ''}`}
                onClick={() => {
                  if (!delayModal.row) return;
                  const minutes = Number(delayModal.minutes || 0);
                  void runAction(
                    `delay:${delayModal.row.id}`,
                    () => signalBarberAppointmentDelay({ appointmentId: String(delayModal.row?.id), delayMinutes: minutes, delayReason: delayModal.reason }),
                    'Atraso sinalizado com sucesso.'
                  );
                  setDelayModal({ open: false, row: null, minutes: '10', reason: '' });
                }}
              >
                Confirmar atraso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleModal.open}>
        <DialogContent className="max-w-md border-borderc/80 bg-slate-950">
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold">Remarcar atendimento</h3>
            <Input
              type="datetime-local"
              value={rescheduleModal.datetime}
              onChange={(e) => setRescheduleModal((current) => ({ ...current, datetime: e.target.value }))}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => setRescheduleModal({ open: false, row: null, datetime: '' })}>Fechar</Button>
              <Button
                type="button"
                disabled={!rescheduleModal.row || !rescheduleModal.datetime || busyKey === `reschedule:${rescheduleModal.row?.id || ''}`}
                onClick={() => {
                  if (!rescheduleModal.row || !rescheduleModal.datetime) return;
                  const startIso = parseIso(rescheduleModal.datetime);
                  const durationMinutes = Number(rescheduleModal.row?.services?.duration_minutes || 30);
                  void runAction(
                    `reschedule:${rescheduleModal.row.id}`,
                    () => rescheduleBarberAppointment({ appointmentId: String(rescheduleModal.row?.id), startIso, durationMinutes }),
                    'Atendimento remarcado com sucesso.'
                  );
                  setRescheduleModal({ open: false, row: null, datetime: '' });
                }}
              >
                Confirmar remarcacao
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={transferModal.open}>
        <DialogContent className="max-w-md border-borderc/80 bg-slate-950">
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold">Transferir atendimento</h3>
            <select
              className="min-h-11 rounded-xl border border-borderc bg-slate-950/45 px-3 text-sm text-text-primary outline-none focus:border-primary/70"
              value={transferModal.toBarberId}
              onChange={(e) => setTransferModal((current) => ({ ...current, toBarberId: e.target.value }))}
            >
              <option value="">Selecione o barbeiro de destino</option>
              {barberOptions
                .filter((barber) => String(barber.id) !== String(transferModal.row?.barber_id || ''))
                .map((barber) => (
                  <option key={barber.id} value={barber.id}>{barber.name}</option>
                ))}
            </select>
            <label className="grid gap-1 text-xs text-text-secondary">
              Novo horario (opcional)
              <Input
                type="datetime-local"
                value={transferModal.datetime}
                onChange={(e) => setTransferModal((current) => ({ ...current, datetime: e.target.value }))}
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => setTransferModal({ open: false, row: null, toBarberId: '', datetime: '' })}>Fechar</Button>
              <Button
                type="button"
                disabled={!transferModal.row || !transferModal.toBarberId || busyKey === `transfer:${transferModal.row?.id || ''}`}
                onClick={() => {
                  if (!transferModal.row || !transferModal.toBarberId) return;
                  const startIso = transferModal.datetime ? parseIso(transferModal.datetime) : undefined;
                  void runAction(
                    `transfer:${transferModal.row.id}`,
                    () => transferBarberAppointment({ appointmentId: String(transferModal.row?.id), toBarberId: transferModal.toBarberId, startIso }),
                    'Atendimento transferido com sucesso.'
                  );
                  setTransferModal({ open: false, row: null, toBarberId: '', datetime: '' });
                }}
              >
                Confirmar transferencia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={contextModal.open}>
        <DialogContent className="max-w-3xl border-borderc/80 bg-slate-950">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Contexto do cliente</h3>
              <Button type="button" variant="outline" onClick={() => setContextModal({ open: false, row: null, loading: false, context: null })}>Fechar</Button>
            </div>
            {contextModal.loading ? (
              <p className="text-sm text-text-secondary">Carregando contexto...</p>
            ) : !contextModal.context ? (
              <p className="text-sm text-text-secondary">Nao foi possivel carregar o contexto.</p>
            ) : (
              <div className="grid gap-3">
                <article className="rounded-xl border border-borderc/80 bg-slate-950/45 p-3">
                  <p className="text-sm font-semibold">Atendimento atual</p>
                  <p className="text-sm text-text-secondary">Cliente: <strong className="text-text-primary">{contextModal.context?.appointment?.users?.name || contextModal.context?.appointment?.users?.email || '-'}</strong></p>
                  <p className="text-sm text-text-secondary">Servico: <strong className="text-text-primary">{contextModal.context?.appointment?.service_name || contextModal.context?.appointment?.services?.name || '-'}</strong></p>
                  <p className="text-sm text-text-secondary">Observacoes: <strong className="text-text-primary">{contextModal.context?.appointment?.notes || 'Sem observacoes'}</strong></p>
                </article>
                <article className="rounded-xl border border-borderc/80 bg-slate-950/45 p-3">
                  <p className="mb-2 text-sm font-semibold">Ultimos servicos</p>
                  <div className="grid gap-2">
                    {(contextModal.context?.lastServices || []).map((row: any) => (
                      <div key={String(row.id)} className="rounded-lg border border-borderc/70 bg-slate-900/35 p-2 text-sm text-text-secondary">
                        <strong className="text-text-primary">{row.service_name || row?.services?.name || 'Servico'}</strong> - {asDateTime(row.start_datetime)}
                      </div>
                    ))}
                    {!(contextModal.context?.lastServices || []).length ? <p className="text-sm text-text-secondary">Sem historico de servicos.</p> : null}
                  </div>
                </article>
                <article className="rounded-xl border border-borderc/80 bg-slate-950/45 p-3">
                  <p className="mb-2 text-sm font-semibold">Historico recente</p>
                  <div className="grid gap-2">
                    {(contextModal.context?.history || []).map((row: any) => (
                      <div key={String(row.id)} className="rounded-lg border border-borderc/70 bg-slate-900/35 p-2 text-sm text-text-secondary">
                        <strong className="text-text-primary">{row.service_name || row?.services?.name || 'Servico'}</strong> - {asDateTime(row.start_datetime)} - {getOperationalStatusLabel(row.status)}
                      </div>
                    ))}
                    {!(contextModal.context?.history || []).length ? <p className="text-sm text-text-secondary">Sem historico recente.</p> : null}
                  </div>
                </article>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
