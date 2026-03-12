'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeletons';
import { useToast } from '@/components/ui/toast';
import { createBookingAppointment, getAvailableSlots, getTodayDateInput } from '@/lib/client-booking';
import { clearBookingDraft, getBookingDraft } from '@/lib/booking-wizard';

export default function BookingDatetimePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateInput());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slots, setSlots] = useState<Array<{ start: string; end: string; label: string }>>([]);
  const [draft, setDraft] = useState<any>(null);
  const [createdId, setCreatedId] = useState('');

  const loadSlots = useCallback(async (dateInput: string, editingAppointmentId?: string) => {
    if (!draft?.barberId || !draft?.serviceDurationMinutes) return;
    setLoading(true);
    try {
      const rows = await getAvailableSlots({
        barberId: String(draft.barberId),
        serviceDurationMinutes: Number(draft.serviceDurationMinutes || 30),
        dateInput,
        editingAppointmentId
      });
      setSlots(rows);
    } catch {
      toast('Falha ao carregar horarios disponiveis.');
    } finally {
      setLoading(false);
    }
  }, [draft?.barberId, draft?.serviceDurationMinutes, toast]);

  useEffect(() => {
    const current = getBookingDraft();
    if (!current?.barberId) {
      router.replace('/booking');
      return;
    }
    if (!current?.serviceId) {
      router.replace('/booking/service');
      return;
    }
    setDraft(current);
  }, [router]);

  useEffect(() => {
    if (!draft?.barberId || !draft?.serviceId) return;
    void loadSlots(selectedDate);
  }, [draft?.barberId, draft?.serviceId, loadSlots, selectedDate]);

  const selectedSlotData = useMemo(
    () => slots.find((row) => row.start === selectedSlot) || null,
    [slots, selectedSlot]
  );

  if (createdId) {
    return (
      <div className="mx-auto grid w-full max-w-4xl gap-4">
        <Card className="border-emerald-300/40 bg-gradient-to-br from-emerald-500/15 via-slate-950/75 to-slate-900/70">
          <CardHeader>
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/45 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              Agendamento confirmado
            </p>
            <CardTitle>Seu horario foi reservado com sucesso</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-text-secondary">
              ID do agendamento: <strong className="text-text-primary">{createdId}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push('/client/home')}>Ir para painel do cliente</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreatedId('');
                  setSelectedSlot('');
                  setSelectedDate(getTodayDateInput());
                  clearBookingDraft();
                  router.push('/booking');
                }}
              >
                Novo agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-slate-950/80">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/90">Agendamento</p>
          <CardTitle>Escolha data e horario</CardTitle>
          <p className="text-sm text-text-secondary">
            {draft?.barberName || 'Profissional'} · {draft?.serviceName || 'Servico'}
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-1 text-xs text-text-secondary">
              Data
              <input
                type="date"
                value={selectedDate}
                min={getTodayDateInput()}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSelectedSlot('');
                }}
                className="min-h-11 rounded-xl border border-borderc bg-slate-950/45 px-3 text-sm text-text-primary outline-none focus:border-primary/70"
              />
            </label>
            <Button variant="outline" className="inline-flex gap-2" onClick={() => router.push('/booking/service')}>
              <ArrowLeft className="h-4 w-4" />
              Voltar para servicos
            </Button>
          </div>

          {loading ? (
            <CardSkeleton />
          ) : !slots.length ? (
            <EmptyState
              title="Sem horarios disponiveis"
              description="Selecione outra data para encontrar um horario livre."
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {slots.map((slot) => {
                const active = selectedSlot === slot.start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => setSelectedSlot(slot.start)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? 'border-primary bg-primary/10 text-text-primary shadow-[0_0_0_1px_rgba(198,154,69,0.25)]'
                        : 'border-borderc bg-slate-950/30 text-text-secondary hover:border-primary/50'
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3 text-sm">
            <p className="text-text-secondary">
              Horario selecionado:{' '}
              <strong className="text-text-primary">
                {selectedSlotData ? new Date(selectedSlotData.start).toLocaleString('pt-BR') : 'Nenhum'}
              </strong>
            </p>
            <p className="mt-1 text-text-secondary">
              Valor: <strong className="text-primary">R$ {Number(draft?.servicePrice || 0).toFixed(2)}</strong>
            </p>
          </div>

          <Button
            disabled={!selectedSlotData || confirming}
            className="inline-flex gap-2"
            onClick={async () => {
              if (!selectedSlotData || !draft?.barberId || !draft?.serviceId) return;
              try {
                setConfirming(true);
                const appointment = await createBookingAppointment({
                  barberId: String(draft.barberId),
                  serviceId: String(draft.serviceId),
                  startIso: selectedSlotData.start,
                  endIso: selectedSlotData.end
                });
                setCreatedId(String(appointment?.id || '').slice(0, 12) || 'agendamento');
                clearBookingDraft();
              } catch (error: any) {
                toast(error?.message || 'Nao foi possivel confirmar agendamento.');
              } finally {
                setConfirming(false);
              }
            }}
          >
            <CalendarClock className="h-4 w-4" />
            {confirming ? 'Confirmando...' : 'Confirmar agendamento'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
