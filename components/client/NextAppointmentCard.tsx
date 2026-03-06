'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeletons';
import { getNextAppointment } from '@/lib/appointments';
import { useToast } from '@/components/ui/toast';

export function NextAppointmentCard() {
  const [loading, setLoading] = useState(true);
  const [next, setNext] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const nextAppointment = await getNextAppointment();
        setNext(nextAppointment);
      } catch {
        toast('Erro ao carregar próximos atendimentos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (loading) return <CardSkeleton />;

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

  return (
    <Card className="group relative overflow-hidden border-borderc bg-gradient-to-br from-slate-950/75 via-slate-900/65 to-slate-950/75 transition-all duration-300 hover:border-primary/45 hover:shadow-[0_14px_45px_rgba(198,154,69,0.15)] hover:-translate-y-[1px]">
      <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition-transform duration-500 group-hover:scale-110" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl transition-transform duration-500 group-hover:scale-110" />

      <CardHeader className="relative flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary/90">Próximo agendamento</p>
          <CardTitle className="text-xl md:text-2xl">{next?.services?.name || 'Serviço'}</CardTitle>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </CardHeader>

      <CardContent className="relative grid gap-3">
        {next ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary"><span aria-hidden>📅</span> Data e hora</p>
              <p className="text-sm font-semibold text-text-primary">{new Date(next.start_datetime).toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary"><span aria-hidden>💈</span> Profissional</p>
              <p className="text-sm font-semibold text-text-primary">{next?.barbers?.users?.name || '-'}</p>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Nenhum agendamento futuro"
            description="Seu próximo agendamento aparecerá aqui."
          />
        )}
      </CardContent>
    </Card>
  );
}
