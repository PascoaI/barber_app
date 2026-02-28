'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeletons';
import { buyAddonSessions, cancelSubscription, getClientSubscriptionPanel, pauseSubscription30Days } from '@/lib/subscriptions';
import { useToast } from '@/components/ui/toast';

export function SubscriptionProgress() {
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<any>(null);
  const { toast } = useToast();

  const reload = async () => {
    setLoading(true);
    try {
      setPanel(await getClientSubscriptionPanel());
    } catch {
      toast('Falha ao carregar assinatura.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const progress = useMemo(() => {
    const total = panel?.sessionsPerMonth || 0;
    const used = panel?.used || 0;
    return total > 0 ? Math.round((used / total) * 100) : 0;
  }, [panel]);

  if (loading) return <CardSkeleton />;
  if (!panel) return <EmptyState title="Sem assinatura ativa" description="Escolha um plano para começar a economizar." />;

  const subscription = panel.subscription;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Minha assinatura</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {subscription.status !== 'active' ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-100/20 p-2 text-sm">⚠ Plano vencido. Status: <strong>{subscription.status}</strong>. O consumo de sessões está bloqueado.</div>
        ) : null}
        <p className="text-sm">{subscription.subscription_plans?.name} · Status: <strong>{subscription.status}</strong></p>
        <p className="text-sm">Renovação: {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString('pt-BR') : '—'}</p>
        <div className="grid gap-1">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-[var(--brand)]" style={{ width: `${progress}%` }} /></div>
          <small className="text-text-secondary">{panel.used}/{panel.sessionsPerMonth} utilizadas</small>
        </div>
        <p className="text-sm">Economia no mês: <strong>R$ {Number(panel.monthlySavings || 0).toFixed(2)}</strong></p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={async () => { await pauseSubscription30Days(String(subscription.id)); toast('Plano pausado por 30 dias.'); reload(); }}>Pausar 30 dias</Button>
          <Button onClick={async () => { await cancelSubscription(String(subscription.id)); toast('Plano cancelado.'); reload(); }}>Cancelar</Button>
          <Button onClick={async () => { await buyAddonSessions(String(subscription.id), 2); toast('Add-on de +2 sessões aplicado.'); reload(); }}>Upgrade +2 sessões</Button>
        </div>

        <div className="grid gap-1 pt-2">
          <small className="text-text-secondary">Histórico de uso</small>
          {(panel.usage || []).slice(0, 5).map((u: any) => (
            <div key={u.id} className="text-xs text-text-secondary">{new Date(u.used_at).toLocaleDateString('pt-BR')} · {u.sessions_used} sessão · R$ {Number(u.service_price || 0).toFixed(2)}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
