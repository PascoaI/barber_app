'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, CircleCheckBig, Scissors } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeletons';
import { getCheckInWindowState, getNextAppointment, performClientCheckIn } from '@/lib/appointments';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

export function NextAppointmentCard() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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
                Check-in habilita automaticamente entre 20 e 30 minutos antes do horario.
              </p>
            ) : null}

            {canCheckIn ? (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  try {
                    setBusy(true);
                    await performClientCheckIn(String(next.id));
                    toast('Check-in realizado com sucesso. Atendimento confirmado.');
                    await loadNextAppointment();
                  } catch (error: any) {
                    toast(error?.message || 'Nao foi possivel realizar check-in.');
                  } finally {
                    setBusy(false);
                  }
                }}
                className="relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl border border-emerald-400/60 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 px-4 font-extrabold uppercase tracking-wide text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="absolute inset-0 animate-pulse bg-white/10" />
                <CircleCheckBig className="relative h-5 w-5" />
                <span className="relative">Realizar check-in</span>
              </button>
            ) : null}
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
