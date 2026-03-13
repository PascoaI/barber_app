'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, RotateCcw, Scissors, UserRound, XCircle } from 'lucide-react';
import { listClientHistory } from '@/lib/appointments';
import { listMyReviewsByAppointment, submitAppointmentReview } from '@/lib/reviews';
import { cancelAppointment, getAvailableSlots, getTodayDateInput, rescheduleAppointment } from '@/lib/client-booking';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function statusLabel(status: string) {
  const key = String(status || '').toLowerCase();
  if (key === 'confirmed') return 'Confirmado';
  if (key === 'completed') return 'Concluído';
  if (key === 'canceled' || key === 'cancelled') return 'Cancelado';
  if (key === 'awaiting_payment') return 'Aguardando pagamento';
  if (key === 'pending') return 'Pendente';
  if (key === 'no_show') return 'Não comparecido';
  return status || '-';
}

function statusStyle(status: string) {
  const key = String(status || '').toLowerCase();
  if (key === 'confirmed') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100';
  if (key === 'completed') return 'border-sky-400/40 bg-sky-500/10 text-sky-100';
  if (key === 'canceled' || key === 'cancelled') return 'border-rose-400/40 bg-rose-500/10 text-rose-100';
  if (key === 'no_show') return 'border-amber-400/40 bg-amber-500/10 text-amber-100';
  return 'border-borderc/80 bg-slate-900/35 text-text-secondary';
}

function asDateInput(value: string) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ClientHistoryPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [reviewMap, setReviewMap] = useState<Record<string, any>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(getTodayDateInput());
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slots, setSlots] = useState<Array<{ start: string; end: string; label: string }>>([]);
  const [slotSelected, setSlotSelected] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState<any>(null);
  const [filters, setFilters] = useState({ status: 'all', from: getTodayDateInput(), to: getTodayDateInput() });

  const load = useCallback(async (activeFilters: { status: string; from: string; to: string }) => {
    setLoading(true);
    try {
      const normalized = {
        status: activeFilters.status === 'all' ? '' : activeFilters.status,
        barber_id: '',
        from: activeFilters.from,
        to: activeFilters.to
      };
      const history = await listClientHistory(normalized);
      setRows(history);
      const reviews = await listMyReviewsByAppointment(history.map((row: any) => String(row.id)));
      setReviewMap(reviews);
    } catch {
      toast('Erro ao carregar seus horários.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const today = getTodayDateInput();
    void load({ status: 'all', from: today, to: today });
  }, [load]);

  const nextUpcomingId = useMemo(() => {
    const row = rows
      .filter((item) => ['pending', 'confirmed', 'awaiting_payment'].includes(String(item.status || '')) && new Date(item.start_datetime).getTime() >= Date.now())
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0];
    return row?.id ? String(row.id) : '';
  }, [rows]);

  const openReschedule = async (row: any) => {
    setRescheduleTarget(row);
    setRescheduleOpen(true);
    setSlotSelected('');
    setRescheduleDate(getTodayDateInput());
    setSlotsLoading(true);
    try {
      const available = await getAvailableSlots({
        barberId: String(row.barber_id),
        serviceDurationMinutes: Number(row?.services?.duration_minutes || 30),
        dateInput: getTodayDateInput(),
        editingAppointmentId: String(row.id)
      });
      setSlots(available);
    } catch {
      toast('Falha ao carregar horários para remarcar.');
    } finally {
      setSlotsLoading(false);
    }
  };

  const loadSlotsForDate = async (dateInput: string) => {
    if (!rescheduleTarget) return;
    setSlotsLoading(true);
    try {
      const available = await getAvailableSlots({
        barberId: String(rescheduleTarget.barber_id),
        serviceDurationMinutes: Number(rescheduleTarget?.services?.duration_minutes || 30),
        dateInput,
        editingAppointmentId: String(rescheduleTarget.id)
      });
      setSlots(available);
    } catch {
      toast('Falha ao carregar horários para remarcar.');
    } finally {
      setSlotsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <h1 className="text-2xl font-semibold">Meus horários</h1>

      <section className="rounded-xl border border-borderc bg-slate-950/35 p-3">
        <div className="grid gap-2 md:grid-cols-4">
          <label className="grid gap-1 text-xs text-text-secondary">
            Data inicial
            <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-text-secondary">
            Data final
            <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-text-secondary">
            Status
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="min-h-11 rounded-xl border border-borderc bg-slate-950/45 px-3 text-sm text-text-primary outline-none focus:border-primary/70"
            >
              <option value="all">Todos</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendente</option>
              <option value="awaiting_payment">Aguardando pagamento</option>
              <option value="completed">Concluído</option>
              <option value="canceled">Cancelado</option>
              <option value="no_show">Não comparecido</option>
            </select>
          </label>
          <div className="grid gap-2 md:items-end">
            <Button onClick={() => { void load(filters); }}>Aplicar filtro</Button>
            <Button variant="outline" onClick={() => {
              const today = getTodayDateInput();
              const reset = { status: 'all', from: today, to: today };
              setFilters(reset);
              void load(reset);
            }}>Hoje</Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-xl border border-borderc bg-slate-950/35 p-4 text-sm text-text-secondary">Carregando horários...</div>
      ) : rows.length === 0 ? (
        <EmptyState title="Sem agendamentos" description="Não há horários para o filtro selecionado." />
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => {
            const status = String(row.status || '');
            const canReschedule = ['confirmed', 'no_show'].includes(status);
            const canCancel = ['pending', 'confirmed', 'awaiting_payment'].includes(status);
            const isUpcoming = String(row.id) === nextUpcomingId;
            return (
              <article key={row.id} className={`relative overflow-hidden rounded-2xl border p-4 grid gap-3 ${isUpcoming ? 'border-primary/80 bg-gradient-to-br from-primary/20 via-slate-950/45 to-slate-900/55 shadow-[0_16px_36px_rgba(198,154,69,0.22)]' : 'border-borderc bg-slate-950/35'}`}>
                {isUpcoming ? (
                  <div className="inline-flex w-fit rounded-full border border-primary/55 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Próximo atendimento
                  </div>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  <p className="flex items-center gap-1.5 text-sm text-text-secondary"><Scissors className="h-4 w-4 text-primary" /><strong className="text-text-primary">Serviço:</strong> {row.services?.name || 'Serviço'}</p>
                  <p className="flex items-center gap-1.5 text-sm text-text-secondary"><UserRound className="h-4 w-4 text-primary" /><strong className="text-text-primary">Profissional:</strong> {row?.barbers?.users?.name || '-'}</p>
                  <p className="flex items-center gap-1.5 text-sm text-text-secondary"><CalendarClock className="h-4 w-4 text-primary" /><strong className="text-text-primary">Data:</strong> {new Date(row.start_datetime).toLocaleDateString('pt-BR')}</p>
                  <p className="flex items-center gap-1.5 text-sm text-text-secondary"><CalendarClock className="h-4 w-4 text-primary" /><strong className="text-text-primary">Horário:</strong> {new Date(row.start_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}>
                    {status === 'confirmed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : status === 'canceled' ? <XCircle className="h-3.5 w-3.5" /> : status === 'no_show' ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
                    {statusLabel(status)}
                  </span>
                </div>

                {(canReschedule || canCancel) ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {canReschedule ? (
                      <Button variant="outline" className="inline-flex gap-2" onClick={() => { void openReschedule(row); }}>
                        <RotateCcw className="h-4 w-4" />
                        Remarcar
                      </Button>
                    ) : null}
                    {canCancel ? (
                      <Button
                        variant="outline"
                        disabled={busyId === String(row.id)}
                        onClick={async () => {
                          try {
                            setBusyId(String(row.id));
                            await cancelAppointment(String(row.id));
                            toast('Agendamento cancelado com sucesso.');
                            await load(filters);
                          } catch (error: any) {
                            toast(error?.message || 'Não foi possível cancelar.');
                          } finally {
                            setBusyId('');
                          }
                        }}
                      >
                        {busyId === String(row.id) ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {status === 'completed' ? (
                  reviewMap[String(row.id)] ? (
                    <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 p-2 text-xs text-emerald-100">
                      Avaliado: {Number(reviewMap[String(row.id)]?.rating || 0)} estrela(s)
                      {reviewMap[String(row.id)]?.comment ? ` · ${String(reviewMap[String(row.id)]?.comment)}` : ''}
                    </div>
                  ) : (
                    <div className="grid gap-2 rounded-lg border border-borderc/80 bg-slate-950/30 p-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = Number(ratings[String(row.id)] || 0) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatings((current) => ({ ...current, [String(row.id)]: star }))}
                              className={`h-9 w-9 rounded-lg border text-sm font-bold transition ${active ? 'border-primary bg-primary/15 text-primary' : 'border-borderc bg-slate-950/40 text-text-secondary hover:border-primary/50'}`}
                              aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>
                      <Input
                        placeholder="Comentário opcional"
                        value={comments[String(row.id)] || ''}
                        onChange={(event) => setComments((current) => ({ ...current, [String(row.id)]: event.target.value }))}
                      />
                      <Button
                        disabled={busyId === String(row.id) || !ratings[String(row.id)]}
                        onClick={async () => {
                          try {
                            setBusyId(String(row.id));
                            await submitAppointmentReview({
                              appointment_id: String(row.id),
                              rating: Number(ratings[String(row.id)] || 0),
                              comment: String(comments[String(row.id)] || '').trim() || undefined
                            });
                            setReviewMap((current) => ({
                              ...current,
                              [String(row.id)]: {
                                rating: Number(ratings[String(row.id)] || 0),
                                comment: String(comments[String(row.id)] || '').trim() || null
                              }
                            }));
                            toast('Avaliação enviada com sucesso.');
                          } catch (error: any) {
                            toast(error?.message || 'Não foi possível enviar avaliação.');
                          } finally {
                            setBusyId('');
                          }
                        }}
                      >
                        {busyId === String(row.id) ? 'Enviando...' : 'Enviar avaliação'}
                      </Button>
                    </div>
                  )
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={rescheduleOpen}>
        <DialogContent className="max-w-2xl border-borderc/80 bg-slate-950">
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold">Remarcar agendamento</h3>
            <label className="grid gap-1 text-xs text-text-secondary">
              Nova data
              <Input
                type="date"
                value={rescheduleDate}
                min={getTodayDateInput()}
                onChange={(event) => {
                  setRescheduleDate(event.target.value);
                  setSlotSelected('');
                  void loadSlotsForDate(event.target.value);
                }}
              />
            </label>
            {slotsLoading ? (
              <p className="text-sm text-text-secondary">Carregando horários...</p>
            ) : !slots.length ? (
              <p className="text-sm text-text-secondary">Sem horários livres nesta data.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {slots.map((slot) => {
                  const active = slotSelected === slot.start;
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSlotSelected(slot.start)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${active ? 'border-primary bg-primary/10 text-text-primary' : 'border-borderc bg-slate-950/40 text-text-secondary hover:border-primary/50'}`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Fechar</Button>
              <Button
                disabled={!slotSelected || busyId === String(rescheduleTarget?.id || '')}
                onClick={async () => {
                  if (!rescheduleTarget || !slotSelected) return;
                  const selected = slots.find((slot) => slot.start === slotSelected);
                  if (!selected) return;
                  try {
                    setBusyId(String(rescheduleTarget.id));
                    await rescheduleAppointment({
                      appointmentId: String(rescheduleTarget.id),
                      startIso: selected.start,
                      endIso: selected.end
                    });
                    toast('Agendamento remarcado com sucesso.');
                    setRescheduleOpen(false);
                    await load(filters);
                  } catch (error: any) {
                    toast(error?.message || 'Não foi possível remarcar.');
                  } finally {
                    setBusyId('');
                  }
                }}
              >
                Confirmar remarcação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
