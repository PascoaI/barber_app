'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Filter, MessageSquareText, UserRound, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/common/Skeletons';
import { Input } from '@/components/ui/input';
import {
  getStatusRequestLabel,
  listStatusChangeRequests,
  reviewStatusChangeRequest,
  type StatusChangeRequestRow
} from '@/lib/status-change-requests';
import { useToast } from '@/components/ui/toast';

function asDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

function chipStyle(status: string) {
  const key = String(status || '').toLowerCase();
  if (key === 'pending') return 'border-amber-400/50 bg-amber-500/15 text-amber-100';
  if (key === 'approved') return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100';
  if (key === 'rejected') return 'border-rose-400/50 bg-rose-500/15 text-rose-100';
  return 'border-borderc/70 bg-slate-900/55 text-text-secondary';
}

export default function AdminStatusRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<StatusChangeRequestRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [busyKey, setBusyKey] = useState('');
  const [reviewNoteMap, setReviewNoteMap] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listStatusChangeRequests(filterStatus === 'all' ? undefined : filterStatus);
      setRows(data);
    } catch (error: any) {
      toast(error?.message || 'Falha ao carregar solicitações.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const pending = rows.filter((item) => item.status === 'pending');
    const approved = rows.filter((item) => item.status === 'approved');
    const rejected = rows.filter((item) => item.status === 'rejected');
    return { pending, approved, rejected };
  }, [rows]);

  const runReview = useCallback(async (requestId: string, action: 'approved' | 'rejected') => {
    const note = String(reviewNoteMap[requestId] || '').trim();
    try {
      setBusyKey(`${action}:${requestId}`);
      await reviewStatusChangeRequest({ requestId, action, reviewNote: note || undefined });
      toast(action === 'approved' ? 'Solicitação aprovada e status aplicado.' : 'Solicitação rejeitada.');
      await load();
    } catch (error: any) {
      toast(error?.message || 'Falha ao atualizar solicitação.');
    } finally {
      setBusyKey('');
    }
  }, [load, reviewNoteMap, toast]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <Card className="border-borderc/80 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_42%),radial-gradient(circle_at_top_right,rgba(198,154,69,0.16),transparent_40%),linear-gradient(145deg,rgba(6,12,24,0.96),rgba(11,19,40,0.94))]">
        <CardHeader className="gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/90">CONTROLE ADMIN</p>
          <CardTitle className="text-2xl md:text-3xl">Solicitações de alteração de status</CardTitle>
          <p className="text-sm text-text-secondary">Aprove ou rejeite pedidos enviados pelos barbeiros, com trilha completa de quem solicitou e quando.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 rounded-2xl border border-borderc/80 bg-slate-950/45 p-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-1">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-text-secondary">
                <Filter className="h-3.5 w-3.5" />
                Filtro
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={filterStatus === 'pending' ? 'default' : 'outline'} onClick={() => setFilterStatus('pending')}>Pendentes</Button>
                <Button type="button" variant={filterStatus === 'approved' ? 'default' : 'outline'} onClick={() => setFilterStatus('approved')}>Aprovadas</Button>
                <Button type="button" variant={filterStatus === 'rejected' ? 'default' : 'outline'} onClick={() => setFilterStatus('rejected')}>Rejeitadas</Button>
                <Button type="button" variant={filterStatus === 'all' ? 'default' : 'outline'} onClick={() => setFilterStatus('all')}>Todas</Button>
              </div>
            </div>
            <div className="grid gap-1 text-xs text-text-secondary md:text-right">
              <p><strong className="text-text-primary">{grouped.pending.length}</strong> pendentes</p>
              <p><strong className="text-text-primary">{grouped.approved.length}</strong> aprovadas</p>
              <p><strong className="text-text-primary">{grouped.rejected.length}</strong> rejeitadas</p>
            </div>
          </div>

          {loading ? (
            <CardSkeleton />
          ) : !rows.length ? (
            <div className="rounded-2xl border border-borderc/80 bg-slate-950/45 p-6 text-sm text-text-secondary">Nenhuma solicitação encontrada para o filtro selecionado.</div>
          ) : (
            <div className="grid gap-3">
              {rows.map((row) => {
                const id = String(row.id);
                const isPending = row.status === 'pending';
                const currentLabel = getStatusRequestLabel(row.current_status);
                const requestedLabel = getStatusRequestLabel(row.requested_status);
                return (
                  <article key={id} className="rounded-2xl border border-borderc/80 bg-[linear-gradient(160deg,rgba(10,18,36,0.95),rgba(6,12,24,0.95))] p-4 shadow-[0_14px_34px_rgba(2,8,24,0.34)]">
                    <div className="grid gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="grid gap-1 text-sm">
                          <p className="font-semibold text-text-primary">Solicitação #{id.slice(0, 8)}</p>
                          <p className="text-text-secondary">Agendamento: <strong className="text-text-primary">{String(row.appointment_id || '-').slice(0, 8)}</strong></p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${chipStyle(row.status)}`}>
                          <Clock3 className="h-3.5 w-3.5" />
                          {getStatusRequestLabel(row.status)}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
                        <p className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5 text-primary" />Barbeiro: <strong className="text-text-primary">{row.barber_name || row.barber_email || '-'}</strong></p>
                        <p className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5 text-primary" />Cliente: <strong className="text-text-primary">{row.client_name || row.client_email || '-'}</strong></p>
                        <p>Status atual: <strong className="text-text-primary">{currentLabel}</strong></p>
                        <p>Status solicitado: <strong className="text-primary">{requestedLabel}</strong></p>
                        <p>Solicitado em: <strong className="text-text-primary">{asDateTime(row.requested_at)}</strong></p>
                        <p>Revisão em: <strong className="text-text-primary">{asDateTime(row.reviewed_at)}</strong></p>
                      </div>

                      <div className="rounded-xl border border-borderc/70 bg-slate-950/55 p-3 text-sm text-text-secondary">
                        <p className="inline-flex items-center gap-1.5"><MessageSquareText className="h-4 w-4 text-primary" />Motivo</p>
                        <p className="mt-1 text-text-primary">{row.reason || 'Sem justificativa.'}</p>
                        {row.review_note ? <p className="mt-2 text-xs text-amber-200/90">Nota do admin: {row.review_note}</p> : null}
                      </div>

                      {isPending ? (
                        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                          <Input
                            placeholder="Nota opcional da análise"
                            value={reviewNoteMap[id] || ''}
                            onChange={(e) => setReviewNoteMap((current) => ({ ...current, [id]: e.target.value }))}
                          />
                          <Button
                            type="button"
                            className="inline-flex gap-2"
                            disabled={busyKey === `approved:${id}` || busyKey === `rejected:${id}`}
                            onClick={() => void runReview(id, 'approved')}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Confirmar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="inline-flex gap-2"
                            disabled={busyKey === `approved:${id}` || busyKey === `rejected:${id}`}
                            onClick={() => void runReview(id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeitar
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
