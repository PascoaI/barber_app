'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Scissors } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/common/Skeletons';
import { useToast } from '@/components/ui/toast';
import { getBookingSetup } from '@/lib/client-booking';
import { saveBookingDraft } from '@/lib/booking-wizard';

export default function BookingEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [barbershopName, setBarbershopName] = useState('');
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBarberId, setSelectedBarberId] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const setup = await getBookingSetup();
        if (!active) return;
        setBarbershopName(setup.barbershopName);
        setBarbers(setup.barbers);
      } catch {
        if (!active) return;
        toast('Falha ao carregar profissionais para agendamento.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [toast]);

  const selectedBarber = barbers.find((row) => row.id === selectedBarberId) || null;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-slate-950/80">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/90">Agendamento</p>
          <CardTitle>Escolha seu profissional</CardTitle>
          <p className="text-sm text-text-secondary">Barbearia: <strong className="text-text-primary">{barbershopName || 'Carregando...'}</strong></p>
        </CardHeader>
        <CardContent className="grid gap-3">
          {loading ? (
            <CardSkeleton />
          ) : (
            <>
              {!barbers.length ? (
                <p className="rounded-xl border border-borderc bg-slate-950/35 p-3 text-sm text-text-secondary">
                  Nenhum profissional ativo encontrado.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {barbers.map((barber) => {
                    const active = selectedBarberId === barber.id;
                    return (
                      <button
                        key={barber.id}
                        type="button"
                        onClick={() => setSelectedBarberId(barber.id)}
                        className={`rounded-xl border p-3 text-left transition ${
                          active
                            ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(198,154,69,0.25)]'
                            : 'border-borderc bg-slate-950/30 hover:border-primary/50'
                        }`}
                      >
                        <p className="text-sm font-semibold">{barber.name}</p>
                        <p className="mt-1 text-xs text-text-secondary">Profissional ativo</p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  disabled={!selectedBarber}
                  onClick={() => {
                    if (!selectedBarber) return;
                    saveBookingDraft({
                      barbershopName: barbershopName || 'Sua barbearia',
                      barberId: selectedBarber.id,
                      barberName: selectedBarber.name,
                      serviceId: undefined,
                      serviceName: undefined,
                      serviceDurationMinutes: undefined,
                      servicePrice: undefined
                    });
                    router.push('/booking/service');
                  }}
                  className="inline-flex gap-2"
                >
                  <Scissors className="h-4 w-4" />
                  Continuar para servicos
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => router.push('/client/home')}>
                  Voltar ao painel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
