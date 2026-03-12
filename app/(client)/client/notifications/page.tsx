'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeletons';
import { useToast } from '@/components/ui/toast';
import { listClientNotifications, markClientNotificationAsRead, type ClientNotificationItem } from '@/lib/notifications';

function typeLabel(type: string) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('confirm')) return 'Confirmacao de agendamento';
  if (normalized.includes('reminder') || normalized.includes('lembrete')) return 'Lembrete de atendimento';
  if (normalized.includes('promo')) return 'Promocao';
  return 'Notificacao';
}

function statusLabel(status: string) {
  if (status === 'read') return 'Lida';
  if (status === 'sent') return 'Enviada';
  return 'Nao lida';
}

export default function ClientNotificationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [rows, setRows] = useState<ClientNotificationItem[]>([]);
  const unreadCount = useMemo(() => rows.filter((row) => row.status !== 'read').length, [rows]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listClientNotifications();
        if (!active) return;
        setRows(data);
      } catch {
        if (!active) return;
        toast('Falha ao carregar notificacoes.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [toast]);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-slate-950/80">
        <CardHeader>
          <CardTitle>Central de notificacoes</CardTitle>
          <p className="text-sm text-text-secondary">Acompanhe confirmacoes, lembretes e promocoes.</p>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3 text-sm">
            <strong>{unreadCount}</strong> notificacao(oes) nao lida(s)
          </div>

          {loading ? (
            <CardSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState title="Sem notificacoes" description="Novas atualizacoes aparecerao aqui." />
          ) : (
            <div className="grid gap-2">
              {rows.map((row) => (
                <article key={row.id} className="rounded-xl border border-borderc/80 bg-slate-950/35 p-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{typeLabel(row.type)}</p>
                    <span className={`rounded-full border px-2 py-1 text-[11px] ${row.status === 'read' ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/40 bg-amber-500/10 text-amber-200'}`}>
                      {statusLabel(row.status)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{row.message || 'Sem mensagem detalhada.'}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <small className="text-xs text-text-secondary">
                      {new Date(row.createdAt || row.sentAt || Date.now()).toLocaleString('pt-BR')}
                    </small>
                    {row.status !== 'read' ? (
                      <Button
                        variant="outline"
                        className="min-h-9 px-3 text-xs"
                        disabled={busyId === row.id}
                        onClick={async () => {
                          try {
                            setBusyId(row.id);
                            await markClientNotificationAsRead(row.id);
                            setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status: 'read' } : item)));
                            toast('Notificacao marcada como lida.');
                          } catch {
                            toast('Nao foi possivel marcar como lida.');
                          } finally {
                            setBusyId('');
                          }
                        }}
                      >
                        {busyId === row.id ? 'Atualizando...' : 'Marcar como lida'}
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
