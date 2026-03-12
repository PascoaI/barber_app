'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock3, Scissors } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/common/Skeletons';
import { useToast } from '@/components/ui/toast';
import { getBookingServices, type BookingService } from '@/lib/client-booking';
import { getBookingDraft, saveBookingDraft } from '@/lib/booking-wizard';

function asCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

export default function BookingServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<BookingService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [barberName, setBarberName] = useState('');

  useEffect(() => {
    const draft = getBookingDraft();
    if (!draft.barberId) {
      router.replace('/booking');
      return;
    }
    setBarberName(String(draft.barberName || 'Profissional'));
    setSelectedServiceId(String(draft.serviceId || ''));

    let active = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await getBookingServices();
        if (!active) return;
        setServices(rows);
      } catch {
        if (!active) return;
        toast('Falha ao carregar servicos.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [router, toast]);

  const selectedService = services.find((row) => row.id === selectedServiceId) || null;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-slate-950/80">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/90">Agendamento</p>
          <CardTitle>Escolha seu servico</CardTitle>
          <p className="text-sm text-text-secondary">Profissional selecionado: <strong className="text-text-primary">{barberName}</strong></p>
        </CardHeader>
        <CardContent className="grid gap-3">
          {loading ? (
            <CardSkeleton />
          ) : (
            <>
              {!services.length ? (
                <p className="rounded-xl border border-borderc bg-slate-950/35 p-3 text-sm text-text-secondary">
                  Nenhum servico ativo encontrado.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {services.map((service) => {
                    const active = selectedServiceId === service.id;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedServiceId(service.id)}
                        className={`rounded-xl border p-3 text-left transition ${
                          active
                            ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(198,154,69,0.25)]'
                            : 'border-borderc bg-slate-950/30 hover:border-primary/50'
                        }`}
                      >
                        <p className="text-sm font-semibold">{service.name}</p>
                        <p className="mt-1 text-xs text-text-secondary">{service.description || 'Sem descricao'}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1 text-text-secondary">
                            <Clock3 className="h-3.5 w-3.5" />
                            {service.durationMinutes} min
                          </span>
                          <strong className="text-primary">{asCurrency(service.price)}</strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" onClick={() => router.push('/booking')} className="inline-flex gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  disabled={!selectedService}
                  onClick={() => {
                    if (!selectedService) return;
                    saveBookingDraft({
                      serviceId: selectedService.id,
                      serviceName: selectedService.name,
                      serviceDurationMinutes: selectedService.durationMinutes,
                      servicePrice: selectedService.price
                    });
                    router.push('/booking/datetime');
                  }}
                  className="inline-flex gap-2"
                >
                  <Scissors className="h-4 w-4" />
                  Continuar para horario
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
