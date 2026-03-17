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
  getBarberDashboardData,
  getOperationalStatusLabel,
  updateBarberAppointmentStatus,
  type BarberAppointmentRow
} from '@/lib/barber-dashboard';
import { createStatusChangeRequest, getStatusRequestLabel } from '@/lib/status-change-requests';
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

type ReasonModalState = {
  open: boolean;
  row: BarberAppointmentRow | null;
  toStatus: 'no_show' | 'canceled' | null;
  reason: string;
};

type StatusRequestModalState = {
  open: boolean;
  row: BarberAppointmentRow | null;
  requestedStatus: 'confirmed' | 'no_show' | 'canceled' | '';
  reason: string;
};

const REQUESTABLE_STATUSES: Array<'confirmed' | 'no_show' | 'canceled'> = ['confirmed', 'no_show', 'canceled'];

export default function BarberEntryPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [busyKey, setBusyKey] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => asInputDate(new Date()));
  const { toast } = useToast();

  const [reasonModal, setReasonModal] = useState<ReasonModalState>({
    open: false,
    row: null,
    toStatus: null,
    reason: ''
  });
  const [statusRequestModal, setStatusRequestModal] = useState<StatusRequestModalState>({
    open: false,
    row: null,
    requestedStatus: '',
    reason: ''
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
      toast(error?.message || 'Falha ao executar ação.');
    } finally {
      setBusyKey('');
    }
  }, [load, toast]);

  const requestableStatusesForRow = useCallback((row: BarberAppointmentRow | null) => {
    const current = String(row?.status || '').toLowerCase();
    return REQUESTABLE_STATUSES.filter((item) => item !== current);
  }, []);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <Card className="border-borderc/80 bg-[radial-gradient(circle_at_0%_0%,rgba(198,154,69,0.18),transparent_36%),radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.16),transparent_42%),linear-gradient(135deg,rgba(2,6,23,0.95),rgba(10,18,40,0.92))]">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/90">OPERAÇÃO BARBER</p>
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
                  <small className="text-emerald-100/80">Somente atendimentos concluídos do barbeiro logado.</small>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-sky-300/45 bg-gradient-to-br from-sky-500/20 via-sky-500/8 to-transparent p-5 shadow-[0_16px_38px_rgba(56,189,248,0.2)]">
                  <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-sky-100/90">
                    <Scissors className="h-4 w-4" />
                    Ganhos da semana
                  </p>
                  <p className="text-3xl font-extrabold leading-none text-sky-50">{asCurrency(Number(dashboard.earningsWeek || 0))}</p>
                  <small className="text-sky-100/80">Soma semanal dos serviços concluídos por você.</small>
                </article>
              </section>

              <section className="rounded-2xl border border-borderc/80 bg-slate-950/45 p-4 shadow-[0_14px_36px_rgba(2,6,23,0.28)]">
                <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">Agenda do barbeiro</h2>
                    <p className="text-xs text-text-secondary">Ações operacionais completas no próprio card do atendimento.</p>
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
                  <EmptyState title="Sem agendamentos nesta data" description="Selecione outra data no calendário para ver os atendimentos." />
                ) : (
                  <div className="grid gap-3">
                    {filteredAppointments.map((row) => {
                      const rowId = String(row.id);
                      const showMoreActions = openActionsId === rowId;
                      const status = String(row.status || '').toLowerCase();
                      const canStart = ['awaiting_payment', 'pending', 'confirmed'].includes(status);
                      const canConclude = ['in_progress', 'pending', 'confirmed'].includes(status);
                      const canNoShow = ['awaiting_payment', 'pending', 'confirmed', 'in_progress'].includes(status);
                      const canCancel = ['awaiting_payment', 'pending', 'confirmed', 'in_progress'].includes(status);

                      return (
                        <article key={row.id} className="rounded-2xl border border-borderc/80 bg-slate-950/55 p-4 shadow-[0_10px_26px_rgba(2,6,23,0.28)]">
                          <div className="grid gap-4">
                            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                              <div className="grid gap-2">
                                <p className="text-base font-semibold">{row._displayService}</p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary"><UserRound className="h-3.5 w-3.5 text-primary" />Cliente: <strong className="text-text-primary">{row._displayClient}</strong></p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary"><CalendarClock className="h-3.5 w-3.5 text-primary" />Atendimento: <strong className="text-text-primary">{asDateTime(row.start_datetime)}</strong></p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary"><CalendarDays className="h-3.5 w-3.5 text-primary" />Criado em: <strong className="text-text-primary">{asDateTime(row.created_at)}</strong></p>
                                <p className="flex items-center gap-1.5 text-xs text-text-secondary"><Clock3 className="h-3.5 w-3.5 text-primary" />Valor: <strong className="text-primary">{asCurrency(row._displayPrice || 0)}</strong></p>
                                <p className="text-xs text-text-secondary">Observações: <strong className="text-text-primary">{row.notes ? String(row.notes) : 'Sem observações registradas.'}</strong></p>
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
                                onClick={() => runAction(`complete:${row.id}`, () => updateBarberAppointmentStatus({ appointmentId: String(row.id), toStatus: 'completed' }), 'Serviço concluído com sucesso.')}
                              >
                                {busyKey === `complete:${row.id}` ? 'Concluindo...' : 'Concluir'}
                              </Button>
                              <div className="relative">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setOpenActionsId((current) => (current === rowId ? null : rowId))}
                                >
                                  {showMoreActions ? 'Ocultar ações' : 'Mais ações'}
                                </Button>
                                {showMoreActions ? (
                                  <div className="absolute right-0 bottom-[calc(100%+0.45rem)] z-30 grid w-[min(12.5rem,calc(100vw-2.5rem))] gap-2 rounded-xl border border-borderc/80 bg-slate-950/95 p-2 shadow-[0_16px_30px_rgba(2,6,23,0.36)]">
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
                                      disabled={!canNoShow}
                                      onClick={() => {
                                        setOpenActionsId(null);
                                        setReasonModal({ open: true, row, toStatus: 'no_show', reason: '' });
                                      }}
                                    >
                                      Não compareceu
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setOpenActionsId(null);
                                        const options = requestableStatusesForRow(row);
                                        setStatusRequestModal({
                                          open: true,
                                          row,
                                          requestedStatus: options[0] || '',
                                          reason: ''
                                        });
                                      }}
                                    >
                                      Alterar status
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
            <h3 className="text-lg font-semibold">{reasonModal.toStatus === 'no_show' ? 'Registrar não comparecimento' : 'Registrar cancelamento'}</h3>
            <p className="text-sm text-text-secondary">Informe a justificativa para atualizar o status do atendimento.</p>
            <Input
              placeholder="Ex.: cliente avisou que não viria"
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
                    reasonModal.toStatus === 'no_show' ? 'Não comparecimento registrado.' : 'Cancelamento registrado.'
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

      <Dialog open={statusRequestModal.open}>
        <DialogContent className="max-w-lg border-borderc/80 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_48%),linear-gradient(180deg,rgba(8,15,30,0.98),rgba(6,12,24,0.98))]">
          <div className="grid gap-4">
            <div className="grid gap-1">
              <h3 className="text-lg font-semibold">Solicitar alteração de status</h3>
              <p className="text-sm text-text-secondary">
                Esta solicitação será enviada para aprovação do admin da barbearia.
              </p>
            </div>

            <div className="rounded-xl border border-borderc/70 bg-slate-950/50 p-3 text-xs text-text-secondary">
              <p>Atendimento: <strong className="text-text-primary">{statusRequestModal.row?._displayService || '-'}</strong></p>
              <p>Cliente: <strong className="text-text-primary">{statusRequestModal.row?._displayClient || '-'}</strong></p>
              <p>Status atual: <strong className="text-text-primary">{getStatusRequestLabel(String(statusRequestModal.row?.status || ''))}</strong></p>
            </div>

            <label className="grid gap-1 text-sm text-text-secondary">
              Novo status desejado
              <select
                value={statusRequestModal.requestedStatus}
                onChange={(e) => setStatusRequestModal((current) => ({ ...current, requestedStatus: e.target.value as StatusRequestModalState['requestedStatus'] }))}
                className="h-11 rounded-xl border border-borderc/80 bg-slate-900/65 px-3 text-sm text-text-primary outline-none transition-colors focus:border-primary/70"
              >
                {requestableStatusesForRow(statusRequestModal.row).map((item) => (
                  <option key={item} value={item}>{getStatusRequestLabel(item)}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm text-text-secondary">
              Justificativa
              <Input
                placeholder="Descreva o motivo da mudança"
                value={statusRequestModal.reason}
                onChange={(e) => setStatusRequestModal((current) => ({ ...current, reason: e.target.value }))}
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusRequestModal({ open: false, row: null, requestedStatus: '', reason: '' })}
              >
                Fechar
              </Button>
              <Button
                type="button"
                disabled={
                  !statusRequestModal.row
                  || !statusRequestModal.requestedStatus
                  || !String(statusRequestModal.reason || '').trim()
                  || busyKey === `status-request:${statusRequestModal.row?.id || ''}`
                }
                onClick={() => {
                  if (!statusRequestModal.row || !statusRequestModal.requestedStatus) return;
                  const reason = String(statusRequestModal.reason || '').trim();
                  void runAction(
                    `status-request:${statusRequestModal.row.id}`,
                    () => createStatusChangeRequest({
                      appointmentId: String(statusRequestModal.row?.id),
                      requestedStatus: statusRequestModal.requestedStatus as 'confirmed' | 'no_show' | 'canceled',
                      reason
                    }),
                    'Solicitação enviada para análise do admin.'
                  );
                  setStatusRequestModal({ open: false, row: null, requestedStatus: '', reason: '' });
                }}
              >
                Confirmar solicitação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
