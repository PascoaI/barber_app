'use client';

import { useCallback, useEffect, useState } from 'react';
import { listClientHistory } from '@/lib/appointments';
import { listMyReviewsByAppointment, submitAppointmentReview } from '@/lib/reviews';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';

export default function ClientHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [reviewMap, setReviewMap] = useState<Record<string, any>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [filters, setFilters] = useState({ status: '', barber_id: '', from: '', to: '' });
  const { toast } = useToast();

  const load = useCallback(async (activeFilters = filters) => {
    try {
      const history = await listClientHistory(activeFilters);
      setRows(history);
      const reviews = await listMyReviewsByAppointment(history.map((row: any) => String(row.id)));
      setReviewMap(reviews);
    } catch {
      toast('Erro ao carregar historico.');
    }
  }, [filters, toast]);

  useEffect(() => {
    void load({ status: '', barber_id: '', from: '', to: '' });
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto grid gap-4">
      <h1 className="text-2xl font-semibold">Historico</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Input placeholder="Status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} />
        <Input placeholder="Barbeiro (id)" value={filters.barber_id} onChange={(e) => setFilters((f) => ({ ...f, barber_id: e.target.value }))} />
        <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
        <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        <Button onClick={() => { void load(filters); }}>Filtrar</Button>
      </div>

      {rows.length === 0 ? <EmptyState title="Sem atendimentos" description="Ajuste os filtros ou faca um agendamento." /> : (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-borderc p-3 grid gap-2">
              <p className="text-sm">
                <strong>{new Date(row.start_datetime).toLocaleString('pt-BR')}</strong> · {row.services?.name || 'Servico'} · {row.status}
              </p>
              {row.status === 'completed' ? (
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
                            className={`h-9 w-9 rounded-lg border text-sm font-bold transition ${
                              active
                                ? 'border-primary bg-primary/15 text-primary'
                                : 'border-borderc bg-slate-950/40 text-text-secondary hover:border-primary/50'
                            }`}
                            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                          >
                            ★
                          </button>
                        );
                      })}
                    </div>
                    <Input
                      placeholder="Comentario opcional"
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
                          toast('Avaliacao enviada com sucesso.');
                        } catch (error: any) {
                          toast(error?.message || 'Nao foi possivel enviar avaliacao.');
                        } finally {
                          setBusyId('');
                        }
                      }}
                    >
                      {busyId === String(row.id) ? 'Enviando...' : 'Enviar avaliacao'}
                    </Button>
                  </div>
                )
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
