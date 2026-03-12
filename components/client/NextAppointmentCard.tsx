'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CircleCheckBig, Scissors } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeletons';
import { getCheckInWindowState, getNextAppointment, performClientCheckIn } from '@/lib/appointments';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cancelAppointment, getAvailableSlots, getTodayDateInput, rescheduleAppointment } from '@/lib/client-booking';

export function NextAppointmentCard() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(getTodayDateInput());
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Array<{ start: string; end: string; label: string }>>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [next, setNext] = useState<any>(null);
  const { toast } = useToast();

  const loadNextAppointment = useCallback(async () => {
    setLoading(true);
    try {
      setNext(await getNextAppointment());
    } catch {
      toast('Erro ao carregar proximos atendimentos.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadNextAppointment();
  }, [loadNextAppointment]);

  const status = String(next?.status || 'pending');
  const statusLabel =
    status === 'confirmed' ? 'Confirmado' :
      status === 'awaiting_payment' ? 'Aguardando pagamento' :
        status === 'pending' ? 'Pendente' :
          status;

  const statusTone =
    status === 'confirmed'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40'
      : status === 'awaiting_payment'
        ? 'bg-amber-500/15 text-amber-200 border-amber-400/40'
        : 'bg-sky-500/15 text-sky-200 border-sky-400/40';

  const checkInState = next?.start_datetime
    ? getCheckInWindowState(String(next.start_datetime))
    : { available: false, minutesToStart: null as number | null };

  const checkInSupportedStatus = ['pending', 'confirmed'].includes(status);
  const canCheckIn = checkInSupportedStatus && checkInState.available;
  const canManage = ['pending', 'confirmed', 'awaiting_payment'].includes(status) && next?.start_datetime && new Date(next.start_datetime).getTime() > Date.now();

  const selectedSlotData = useMemo(
    () => availableSlots.find((slot) => slot.start === selectedSlot) || null,
    [availableSlots, selectedSlot]
  );

  const loadRescheduleSlots = useCallback(async () => {
    if (!next?.barber_id || !next?.services?.duration_minutes) return;
    setSlotsLoading(true);
    try {
      const slots = await getAvailableSlots({
        barberId: String(next.barber_id),
        serviceDurationMinutes: Number(next.services.duration_minutes || 30),
        dateInput: rescheduleDate,
        editingAppointmentId: String(next.id)
      });
      setAvailableSlots(slots);
    } catch {
      toast('Falha ao carregar horarios para reagendamento.');
    } finally {
      setSlotsLoading(false);
    }
  }, [next?.barber_id, next?.id, next?.services?.duration_minutes, rescheduleDate, toast]);

  useEffect(() => {
    if (!rescheduleOpen) return;
    void loadRescheduleSlots();
  }, [loadRescheduleSlots, rescheduleOpen]);

  const confirmCheckIn = async () => {
    try {
      setBusy(true);
      await performClientCheckIn(String(next.id));
      toast('Check-in realizado com sucesso. Atendimento confirmado.');
      setConfirmOpen(false);
      await loadNextAppointment();
    } catch (error: any) {
      toast(error?.message || 'Nao foi possivel realizar check-in.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <CardSkeleton />;

  return (
    <Card className="group relative overflow-hidden border-borderc bg-gradient-to-br from-slate-950/75 via-slate-900/65 to-slate-950/75 transition-all duration-300 hover:border-primary/45 hover:shadow-[0_14px_45px_rgba(198,154,69,0.15)] hover:-translate-y-[1px]">
      <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition-transform duration-500 group-hover:scale-110" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl transition-transform duration-500 group-hover:scale-110" />

      <CardHeader className="relative flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary/90">Proximo agendamento</p>
          <CardTitle className="text-xl md:text-2xl">{next?.services?.name || 'Servico'}</CardTitle>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </CardHeader>

      <CardContent className="relative grid gap-3">
        {next ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Data e hora
                </p>
                <p className="text-sm font-semibold text-text-primary">{new Date(next.start_datetime).toLocaleString('pt-BR')}</p>
              </div>
              <div className="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary">
                  <Scissors className="h-3.5 w-3.5" />
                  Profissional
                </p>
                <p className="text-sm font-semibold text-text-primary">{next?.barbers?.users?.name || '-'}</p>
              </div>
            </div>

            {checkInSupportedStatus && !canCheckIn && checkInState.minutesToStart !== null ? (
              <p className="text-xs text-text-secondary">
                Check-in habilita automaticamente entre 15 e 30 minutos antes do horario.
              </p>
            ) : null}

            {canCheckIn ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmOpen(true)}
                className="relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl border border-emerald-400/60 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 px-4 font-extrabold uppercase tracking-wide text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="absolute inset-0 animate-pulse bg-white/10" />
                <CircleCheckBig className="relative h-5 w-5" />
                <span className="relative">Realizar check-in</span>
              </button>
            ) : null}

            {canManage ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => { setRescheduleOpen(true); setSelectedSlot(''); }}>
                  Reagendar
                </Button>
                <Button type="button" variant="outline" onClick={() => setCancelOpen(true)}>
                  Cancelar
                </Button>
              </div>
            ) : null}

            <Dialog open={confirmOpen}>
              <DialogContent className="border-emerald-400/35 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-0 shadow-[0_22px_70px_rgba(8,145,178,0.28)]">
                <div className="relative overflow-hidden rounded-2xl p-5">
                  <div className="pointer-events-none absolute -right-16 -top-14 h-36 w-36 rounded-full bg-emerald-500/20 blur-3xl" />
                  <div className="pointer-events-none absolute -left-16 -bottom-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />

                  <div className="relative grid gap-3">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/45 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                      <CircleCheckBig className="h-3.5 w-3.5" />
                      Confirmacao de check-in
                    </div>

                    <h3 className="text-xl font-bold text-text-primary">Confirmar sua presenca agora?</h3>
                    <p className="text-sm text-text-secondary">
                      Ao confirmar, o atendimento sera marcado como concluido e contabilizado no financeiro.
                    </p>

                    <div className="rounded-xl border border-borderc/80 bg-slate-950/40 p-3 text-sm">
                      <p className="font-semibold text-text-primary">{next?.services?.name || 'Servico'}</p>
                      <p className="text-text-secondary">{next?.barbers?.users?.name || '-'}</p>
                      <p className="text-text-secondary">
                        {next?.start_datetime ? new Date(next.start_datetime).toLocaleString('pt-BR') : '--'}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        disabled={busy}
                        onClick={() => setConfirmOpen(false)}
                      >
                        Voltar
                      </Button>
                      <Button
                        type="button"
                        className="min-h-11 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                        disabled={busy}
                        onClick={confirmCheckIn}
                      >
                        {busy ? 'Confirmando...' : 'Confirmar check-in'}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={rescheduleOpen}>
              <DialogContent className="max-w-2xl border-borderc/80 bg-slate-950">
                <div className="grid gap-3">
                  <h3 className="text-lg font-semibold">Reagendar atendimento</h3>
                  <label className="grid gap-1 text-xs text-text-secondary">
                    Nova data
                    <input
                      type="date"
                      value={rescheduleDate}
                      min={getTodayDateInput()}
                      onChange={(event) => {
                        setRescheduleDate(event.target.value);
                        setSelectedSlot('');
                      }}
                      className="min-h-11 rounded-xl border border-borderc bg-slate-950/45 px-3 text-sm text-text-primary outline-none focus:border-primary/70"
                    />
                  </label>

                  {slotsLoading ? (
                    <p className="text-sm text-text-secondary">Carregando horarios...</p>
                  ) : !availableSlots.length ? (
                    <p className="text-sm text-text-secondary">Sem horarios livres nesta data.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {availableSlots.map((slot) => {
                        const active = selectedSlot === slot.start;
                        return (
                          <button
                            key={slot.start}
                            type="button"
                            onClick={() => setSelectedSlot(slot.start)}
                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                              active
                                ? 'border-primary bg-primary/10 text-text-primary'
                                : 'border-borderc bg-slate-950/40 text-text-secondary hover:border-primary/50'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" disabled={busy} onClick={() => setRescheduleOpen(false)}>
                      Fechar
                    </Button>
                    <Button
                      disabled={busy || !selectedSlotData}
                      onClick={async () => {
                        if (!selectedSlotData || !next?.id) return;
                        try {
                          setBusy(true);
                          await rescheduleAppointment({
                            appointmentId: String(next.id),
                            startIso: selectedSlotData.start,
                            endIso: selectedSlotData.end
                          });
                          toast('Agendamento reagendado com sucesso.');
                          setRescheduleOpen(false);
                          await loadNextAppointment();
                        } catch (error: any) {
                          toast(error?.message || 'Nao foi possivel reagendar.');
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {busy ? 'Reagendando...' : 'Confirmar reagendamento'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={cancelOpen}>
              <DialogContent className="max-w-md border-borderc/80 bg-slate-950">
                <div className="grid gap-3">
                  <h3 className="text-lg font-semibold">Cancelar agendamento</h3>
                  <p className="text-sm text-text-secondary">
                    Deseja realmente cancelar seu proximo atendimento?
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" disabled={busy} onClick={() => setCancelOpen(false)}>
                      Voltar
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={async () => {
                        if (!next?.id) return;
                        try {
                          setBusy(true);
                          await cancelAppointment(String(next.id));
                          toast('Agendamento cancelado com sucesso.');
                          setCancelOpen(false);
                          await loadNextAppointment();
                        } catch (error: any) {
                          toast(error?.message || 'Nao foi possivel cancelar.');
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {busy ? 'Cancelando...' : 'Confirmar cancelamento'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <EmptyState
            title="Nenhum agendamento futuro"
            description="Seu proximo agendamento aparecera aqui."
          />
        )}
      </CardContent>
    </Card>
  );
}
