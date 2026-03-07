'use client';

import { useEffect, useState } from 'react';
import { listClientHistory } from '@/lib/appointments';
import { submitAppointmentReview } from '@/lib/reviews';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';

export default function ClientHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: '', barber_id: '', from: '', to: '' });
  const { toast } = useToast();

  const load = async () => {
    try {
      setRows(await listClientHistory(filters));
    } catch {
      toast('Erro ao carregar histórico.');
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="max-w-5xl mx-auto grid gap-4">
      <h1 className="text-2xl font-semibold">Histórico</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Input placeholder="Status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} />
        <Input placeholder="Barbeiro (id)" value={filters.barber_id} onChange={(e) => setFilters((f) => ({ ...f, barber_id: e.target.value }))} />
        <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
        <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        <Button onClick={load}>Filtrar</Button>
      </div>

      {rows.length === 0 ? <EmptyState title="Sem atendimentos" description="Ajuste os filtros ou faça um agendamento." /> : (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-borderc p-3 grid gap-2">
              <p className="text-sm"><strong>{new Date(row.start_datetime).toLocaleString('pt-BR')}</strong> · {row.services?.name || 'Serviço'} · {row.status}</p>
              {row.status === 'completed' ? (
                <Button onClick={async () => {
                  try {
                    await submitAppointmentReview({ appointment_id: String(row.id), rating: 5, comment: 'Excelente atendimento' });
                    toast('Avaliação enviada com sucesso.');
                  } catch (e: any) {
                    toast(e?.message || 'Não foi possível enviar avaliação.');
                  }
                }}>Avaliar serviço</Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
