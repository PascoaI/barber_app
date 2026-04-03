'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, KeyRound, Pencil, PlusCircle, Power, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { SuperAdminShell } from '@/components/superadmin';
import {
  isSuperAdminSession,
  decideOnboardingRequest,
  listOnboardingRequests,
  listPlatformBarbershops,
  removePlatformBarbershop,
  resetPlatformBarbershopPassword,
  togglePlatformBarbershopStatus
} from '@/services/superadmin';
import type { Barbershop } from '@/types/barbershop';

type ConfirmAction = {
  id: string;
  mode: 'reset' | 'delete';
};

const STATUS_LABEL: Record<Barbershop['status'], string> = {
  active: 'Ativa',
  trial: 'Trial',
  suspended: 'Suspensa',
  disabled: 'Desativada'
};

const STATUS_STYLE: Record<Barbershop['status'], string> = {
  active: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  trial: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  suspended: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  disabled: 'border-red-500/40 bg-red-500/10 text-red-300'
};

export default function SuperAdminBarbershopsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<Barbershop[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const load = useCallback(async () => {
    try {
      const [shops, requestRows] = await Promise.all([listPlatformBarbershops(), listOnboardingRequests()]);
      setRows(shops);
      setRequests(requestRows);
    } catch (error: any) {
      toast(error?.message || 'Falha ao carregar barbearias.');
    }
  }, [toast]);

  useEffect(() => {
    void (async () => {
      if (!(await isSuperAdminSession())) {
        router.replace('/superadmin/login');
        return;
      }
      await load();
    })();
  }, [router, load]);

  const onToggle = async (id: string) => {
    const res = await togglePlatformBarbershopStatus(id);
    if (!res.ok) return toast(res.message);
    await load();
    toast('Status atualizado.');
  };

  const handleDecision = async (requestId: string, decision: 'approve' | 'reject') => {
    const res = await decideOnboardingRequest(requestId, { decision });
    if (!res.ok) return toast(res.message);
    toast(decision === 'approve' ? 'Solicitacao aprovada e tenant criado.' : 'Solicitacao rejeitada.');
    await load();
  };

  const confirmDetails = useMemo(() => {
    if (!confirmAction) return null;
    if (confirmAction.mode === 'reset') {
      return {
        title: 'Resetar senha da barbearia?',
        description: 'A senha de acesso admin sera redefinida para 123456.',
        cta: 'Resetar senha'
      };
    }
    return {
      title: 'Excluir barbearia?',
      description: 'Esta acao remove permanentemente o cadastro da plataforma.',
      cta: 'Excluir agora'
    };
  }, [confirmAction]);

  const runConfirm = async () => {
    if (!confirmAction) return;

    if (confirmAction.mode === 'reset') {
      const res = await resetPlatformBarbershopPassword(confirmAction.id);
      setConfirmAction(null);
      if (!res.ok) return toast(res.message);
      toast('Senha redefinida para 123456.');
      return;
    }

    const res = await removePlatformBarbershop(confirmAction.id);
    setConfirmAction(null);
    if (!res.ok) return toast(res.message);
    await load();
    toast('Barbearia excluida.');
  };

  return (
    <SuperAdminShell title="Barbearias da Plataforma" subtitle="Listagem, status e acoes administrativas.">
      <section className="mb-4 rounded-2xl border border-borderc bg-gradient-to-r from-slate-950/60 via-slate-900/45 to-slate-950/60 p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1">
            <strong className="text-sm md:text-base">Gerencie todas as barbearias em um unico painel</strong>
            <p className="text-xs text-text-secondary md:text-sm">
              Adicione novas operacoes e controle status, senha e dados de contato com um fluxo mais rapido.
            </p>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-2 md:w-auto">
            <Button
              type="button"
              className="inline-flex w-full items-center gap-2 bg-gradient-to-r from-primary via-amber-300 to-primary px-5 text-slate-900 shadow-soft hover:brightness-110"
              onClick={() => router.push('/superadmin/barbershops/new')}
            >
              <PlusCircle className="h-4 w-4" />
              Adicionar barbearia
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => router.push('/superadmin/dashboard')}>
              Voltar ao dashboard
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <strong>Solicitacoes de novas barbearias</strong>
          <small className="text-text-secondary">{requests.filter((item) => item.status === 'pending').length} pendentes</small>
        </div>
        {requests.map((request) => (
          <article key={request.id} className="grid gap-3 rounded-2xl border border-borderc bg-slate-950/35 p-4 lg:grid-cols-[1.2fr_auto] lg:items-center">
            <div className="grid gap-1">
              <strong>{request.barbershop_name}</strong>
              <small className="text-text-secondary">{request.owner_name} | {request.email} | {request.phone}</small>
              <small className="text-text-secondary">{request.city}/{request.state} | slug sugerido: {request.requested_slug || 'automatico'}</small>
              <small className="text-text-secondary">Status: {request.status}</small>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Button type="button" className="w-full gap-2 sm:w-auto" onClick={() => handleDecision(request.id, 'approve')} disabled={request.status !== 'pending'}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
              </Button>
              <Button type="button" variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => handleDecision(request.id, 'reject')} disabled={request.status !== 'pending'}>
                <XCircle className="h-3.5 w-3.5" /> Rejeitar
              </Button>
            </div>
          </article>
        ))}
        {!requests.length ? (
          <article className="rounded-2xl border border-borderc bg-slate-950/35 p-5 text-center text-sm text-text-secondary">
            Nenhuma solicitacao de onboarding encontrada.
          </article>
        ) : null}
      </section>

      <div className="grid gap-3">
        {rows.map((shop) => (
          <article key={shop.id} className="grid gap-3 rounded-2xl border border-borderc bg-slate-950/35 p-4 lg:grid-cols-[1.2fr_auto] lg:items-center">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-base">{shop.name}</strong>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] ${STATUS_STYLE[shop.status]}`}>
                  {STATUS_LABEL[shop.status]}
                </span>
              </div>
              <small className="text-text-secondary">{shop.owner_name} | {shop.email} | {shop.phone}</small>
              <small className="text-text-secondary">Plano: <strong className="text-text-primary">{shop.plan.toUpperCase()}</strong>{shop.plan_expires_at ? ` · Expira em ${new Date(shop.plan_expires_at).toLocaleDateString('pt-BR')}` : ''}</small>
              <small className="text-text-secondary">Criada em {new Date(shop.created_at).toLocaleDateString('pt-BR')}</small>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Button type="button" variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => router.push(`/superadmin/barbershops/${shop.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button type="button" variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => onToggle(shop.id)}>
                <Power className="h-3.5 w-3.5" /> {shop.status === 'disabled' ? 'Ativar' : 'Desativar'}
              </Button>
              <Button type="button" variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => setConfirmAction({ id: shop.id, mode: 'reset' })}>
                <KeyRound className="h-3.5 w-3.5" /> Reset senha
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full gap-2 border border-red-500/50 shadow-sm shadow-red-950/50 sm:w-auto"
                onClick={() => setConfirmAction({ id: shop.id, mode: 'delete' })}
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
            </div>
          </article>
        ))}

        {!rows.length ? (
          <article className="rounded-2xl border border-borderc bg-slate-950/35 p-5 text-center text-sm text-text-secondary">
            Nenhuma barbearia cadastrada.
          </article>
        ) : null}
      </div>

      <Dialog open={Boolean(confirmAction && confirmDetails)}>
        <DialogContent className="grid gap-4 border-borderc/90 bg-slate-950/95">
          <div className="grid gap-1">
            <strong className="text-base">{confirmDetails?.title}</strong>
            <p className="text-sm text-text-secondary">{confirmDetails?.description}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>
              Cancelar
            </Button>
            <Button type="button" variant={confirmAction?.mode === 'delete' ? 'destructive' : 'default'} onClick={runConfirm}>
              {confirmDetails?.cta}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SuperAdminShell>
  );
}
