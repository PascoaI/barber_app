'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
      } catch (error) {
        toast('Erro ao carregar próximos atendimentos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (loading) return <CardSkeleton />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Próximo agendamento</CardTitle>
        <small className="text-text-secondary">Atualizado agora</small>
      </CardHeader>
      <CardContent className="grid gap-3">
        {next ? (
          <>
            <p className="text-sm">
              <strong>{new Date(next.start_datetime).toLocaleString('pt-BR')}</strong> · {next?.services?.name || 'Serviço'}
            </p>
            <p className="text-xs text-text-secondary">Status: {next.status}</p>
            <div>
              <Button onClick={() => { window.location.href = '/booking-datetime'; }}>Agendar outro horário</Button>
            </div>
          </>
        ) : (
          <EmptyState
            title="Nenhum agendamento futuro"
            description="Seu próximo agendamento aparecerá aqui."
            action={<a href="/booking-location" className="underline text-sm">Agendar agora</a>}
          />
        )}
      </CardContent>
    </Card>
  );
}
