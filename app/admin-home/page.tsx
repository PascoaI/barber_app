'use client';

import { useEffect, useState } from 'react';
import { MrrCards } from '@/components/admin/MrrCards';
import { OccupancyTable } from '@/components/admin/OccupancyTable';
import { blockClientUntil, getAdminKpis, getOccupancyByBarber, getRecurringNoShowClients, getRetentionReport, unblockClient } from '@/lib/analytics';
import { CardSkeleton, TableSkeleton } from '@/components/common/Skeletons';
import { useToast } from '@/components/ui/toast';

export default function AdminHomePage() {
  const [kpis, setKpis] = useState<any>(null);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [retention, setRetention] = useState<any>(null);
  const [repeatNoShows, setRepeatNoShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockId, setUnlockId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [k, o, r, n] = await Promise.all([getAdminKpis(), getOccupancyByBarber(), getRetentionReport(30), getRecurringNoShowClients()]);
        setKpis(k);
        setOccupancy(o);
        setRetention(r);
        setRepeatNoShows(n);
      } catch {
        toast('Falha ao carregar dashboard admin.');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  return (
    <div className="max-w-6xl mx-auto grid gap-4">
      <h1 className="text-2xl font-semibold">Dashboard Admin</h1>
      {loading || !kpis ? <CardSkeleton /> : <MrrCards mrr={kpis.mrr} activeSubscribers={kpis.activeSubscribers} forecast={kpis.forecast} />}
      <div className="rounded-xl border border-borderc p-3 text-sm">No-show: {kpis?.noShows || 0} · Taxa: {Number(kpis?.noShowRate || 0).toFixed(1)}% · Atualizado: {kpis?.updatedAt ? new Date(kpis.updatedAt).toLocaleTimeString('pt-BR') : '—'}</div>
      <h2 className="text-lg font-semibold">Ocupação por barbeiro</h2>
      {loading ? <TableSkeleton /> : <OccupancyTable data={occupancy} />}

      <div className="rounded-xl border border-borderc p-3 text-sm grid gap-2">
        <p className="font-medium">Clientes reincidentes em no-show</p>
        <ul className="list-disc ml-5">{repeatNoShows.map((c: any) => <li key={c.client_id}>{c.name || c.email || c.client_id} ({c.total})</li>)}</ul>
        {repeatNoShows[0] ? (
          <button className="text-left underline" onClick={async () => {
            const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            await blockClientUntil(String(repeatNoShows[0].client_id), until);
            toast('Cliente bloqueado por 7 dias para novos agendamentos.');
          }}>Bloquear 1º reincidente por 7 dias</button>
        ) : null}
      </div>
      <div className="rounded-xl border border-borderc p-3 text-sm grid gap-2">
        <p className="font-medium">Desbloqueio manual</p>
        <div className="flex gap-2">
          <input className="border rounded px-2 py-1 flex-1" value={unlockId} onChange={(e) => setUnlockId(e.target.value)} placeholder="ID do cliente" />
          <button className="underline" onClick={async () => { if (!unlockId) return; await unblockClient(unlockId); toast('Cliente desbloqueado manualmente.'); setUnlockId(''); }}>Desbloquear cliente</button>
        </div>
      </div>
      <h2 className="text-lg font-semibold">Retenção</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-borderc p-3 text-sm">
          <p className="font-medium">Clientes sem agendar há 30 dias</p>
          <ul className="list-disc ml-5 mt-1">{(retention?.staleClients || []).slice(0, 5).map((c: any) => <li key={c.id}>{c.name || c.email}</li>)}</ul>
        </div>
        <div className="rounded-xl border border-borderc p-3 text-sm">
          <p className="font-medium">Assinaturas perto de expirar</p>
          <ul className="list-disc ml-5 mt-1">{(retention?.expiringSubs || []).slice(0, 5).map((s: any, i: number) => <li key={i}>Usuário {s.user_id} · expira em {new Date(s.expires_at).toLocaleDateString('pt-BR')}</li>)}</ul>
        </div>
      </div>
      <div className="rounded-xl border border-borderc p-3 text-sm">
        <p className="font-medium">Top planos</p>
        <ul className="list-disc ml-5 mt-1">{(kpis?.topPlans || []).slice(0, 5).map((p: any) => <li key={p.name}>{p.name} ({p.total})</li>)}</ul>
      </div>
    </div>
  );
}
