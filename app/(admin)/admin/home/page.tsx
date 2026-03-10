'use client';

import { useCallback, useEffect, useState } from 'react';
import { MrrCards } from '@/components/admin/MrrCards';
import { OccupancyTable } from '@/components/admin/OccupancyTable';
import { CardSkeleton, TableSkeleton } from '@/components/common/Skeletons';
import { blockClientUntil, getAdminKpis, getOccupancyByBarber, getRecurringNoShowClients, getRetentionReport, unblockClient } from '@/lib/analytics';
import { confirmAppointmentAttendanceByAdmin, getAdminAttendanceHistory } from '@/lib/appointments';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

export default function AdminHomePage() {
  const [kpis, setKpis] = useState<any>(null);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [retention, setRetention] = useState<any>(null);
  const [repeatNoShows, setRepeatNoShows] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<{ completed: any[]; overdueWithoutCheckIn: any[] }>({ completed: [], overdueWithoutCheckIn: [] });
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [unlockId, setUnlockId] = useState('');
  const { toast } = useToast();

  const loadAttendanceHistory = useCallback(async () => {
    setAttendanceLoading(true);
    try {
      setAttendanceHistory(await getAdminAttendanceHistory(8));
    } catch {
      toast('Falha ao carregar historico de atendimentos.');
    } finally {
      setAttendanceLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [k, o, r, n] = await Promise.all([
          getAdminKpis(),
          getOccupancyByBarber(),
          getRetentionReport(30),
          getRecurringNoShowClients()
        ]);
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
    void loadAttendanceHistory();
  }, [toast, loadAttendanceHistory]);

  return (
    <div className="mx-auto grid max-w-6xl gap-4">
      <h1 className="text-2xl font-semibold">Dashboard Admin</h1>
      {loading || !kpis ? <CardSkeleton /> : <MrrCards mrr={kpis.mrr} activeSubscribers={kpis.activeSubscribers} forecast={kpis.forecast} />}

      <div className="rounded-xl border border-borderc p-3 text-sm">
        No-show: {kpis?.noShows || 0} | Taxa: {Number(kpis?.noShowRate || 0).toFixed(1)}% | Atualizado: {kpis?.updatedAt ? new Date(kpis.updatedAt).toLocaleTimeString('pt-BR') : '--'}
      </div>

      <h2 className="text-lg font-semibold">Ocupacao por barbeiro</h2>
      {loading ? <TableSkeleton /> : <OccupancyTable data={occupancy} />}

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-xl border border-borderc bg-slate-950/35 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">Historico recente (concluidos)</p>
            <small className="text-text-secondary">{attendanceHistory.completed.length} itens</small>
          </div>
          {attendanceLoading ? <TableSkeleton /> : (
            <div className="grid gap-2">
              {attendanceHistory.completed.length ? attendanceHistory.completed.map((row) => (
                <div key={row.id} className="rounded-lg border border-borderc/80 bg-slate-950/35 p-2.5 text-sm">
                  <p className="font-medium">{row.services?.name || 'Servico'} - {new Date(row.start_datetime).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-text-secondary">
                    Cliente: {row.users?.name || row.users?.email || row.client_id} | Barbeiro: {row.barbers?.users?.name || '--'}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Check-in: {row.check_in_by ? `${row.check_in_by} em ${new Date(row.check_in_time || row.service_completed_at || row.start_datetime).toLocaleString('pt-BR')}` : 'Nao registrado'}
                  </p>
                </div>
              )) : (
                <p className="rounded-lg border border-borderc/80 bg-slate-950/35 p-2.5 text-sm text-text-secondary">Sem atendimentos concluidos recentes.</p>
              )}
            </div>
          )}
        </article>

        <article className="rounded-xl border border-borderc bg-slate-950/35 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">Agendamentos sem check-in (passaram do horario)</p>
            <small className="text-text-secondary">{attendanceHistory.overdueWithoutCheckIn.length} pendentes</small>
          </div>
          {attendanceLoading ? <TableSkeleton /> : (
            <div className="grid gap-2">
              {attendanceHistory.overdueWithoutCheckIn.length ? attendanceHistory.overdueWithoutCheckIn.map((row) => (
                <div key={row.id} className="rounded-lg border border-borderc/80 bg-slate-950/35 p-2.5 text-sm">
                  <p className="font-medium">{row.services?.name || 'Servico'} - {new Date(row.start_datetime).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-text-secondary">
                    Cliente: {row.users?.name || row.users?.email || row.client_id} | Barbeiro: {row.barbers?.users?.name || '--'} | Status: {row.status}
                  </p>
                  <Button
                    className="mt-2"
                    disabled={actionId === String(row.id)}
                    onClick={async () => {
                      try {
                        setActionId(String(row.id));
                        await confirmAppointmentAttendanceByAdmin(String(row.id));
                        toast('Atendimento confirmado manualmente com sucesso.');
                        await Promise.all([
                          loadAttendanceHistory(),
                          (async () => {
                            const refreshed = await getAdminKpis();
                            setKpis(refreshed);
                          })()
                        ]);
                      } catch (error: any) {
                        toast(error?.message || 'Nao foi possivel confirmar atendimento.');
                      } finally {
                        setActionId('');
                      }
                    }}
                  >
                    Confirmar atendimento
                  </Button>
                </div>
              )) : (
                <p className="rounded-lg border border-borderc/80 bg-slate-950/35 p-2.5 text-sm text-text-secondary">Sem agendamentos pendentes para confirmacao manual.</p>
              )}
            </div>
          )}
        </article>
      </div>

      <div className="rounded-xl border border-borderc p-3 text-sm grid gap-2">
        <p className="font-medium">Clientes reincidentes em no-show</p>
        <ul className="ml-5 list-disc">{repeatNoShows.map((c: any) => <li key={c.client_id}>{c.name || c.email || c.client_id} ({c.total})</li>)}</ul>
        {repeatNoShows[0] ? (
          <button
            className="text-left underline"
            onClick={async () => {
              const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
              await blockClientUntil(String(repeatNoShows[0].client_id), until);
              toast('Cliente bloqueado por 7 dias para novos agendamentos.');
            }}
          >
            Bloquear 1o reincidente por 7 dias
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-borderc p-3 text-sm grid gap-2">
        <p className="font-medium">Desbloqueio manual</p>
        <div className="flex gap-2">
          <input className="flex-1 rounded border px-2 py-1" value={unlockId} onChange={(e) => setUnlockId(e.target.value)} placeholder="ID do cliente" />
          <button
            className="underline"
            onClick={async () => {
              if (!unlockId) return;
              await unblockClient(unlockId);
              toast('Cliente desbloqueado manualmente.');
              setUnlockId('');
            }}
          >
            Desbloquear cliente
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold">Retencao</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-borderc p-3 text-sm">
          <p className="font-medium">Clientes sem agendar ha 30 dias</p>
          <ul className="ml-5 mt-1 list-disc">{(retention?.staleClients || []).slice(0, 5).map((c: any) => <li key={c.id}>{c.name || c.email}</li>)}</ul>
        </div>
        <div className="rounded-xl border border-borderc p-3 text-sm">
          <p className="font-medium">Assinaturas perto de expirar</p>
          <ul className="ml-5 mt-1 list-disc">{(retention?.expiringSubs || []).slice(0, 5).map((s: any, i: number) => <li key={i}>Usuario {s.user_id} | expira em {new Date(s.expires_at).toLocaleDateString('pt-BR')}</li>)}</ul>
        </div>
      </div>

      <div className="rounded-xl border border-borderc p-3 text-sm">
        <p className="font-medium">Top planos</p>
        <ul className="ml-5 mt-1 list-disc">{(kpis?.topPlans || []).slice(0, 5).map((p: any) => <li key={p.name}>{p.name} ({p.total})</li>)}</ul>
      </div>
    </div>
  );
}
