'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { SuperAdminShell } from '@/components/superadmin';
import {
  isSuperAdminSession,
  listPlatformBarbershops,
  removePlatformBarbershop,
  resetPlatformBarbershopPassword,
  togglePlatformBarbershopStatus
} from '@/services/superadmin';
import type { Barbershop } from '@/types/barbershop';

export default function SuperAdminBarbershopsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<Barbershop[]>([]);

  const load = () => setRows(listPlatformBarbershops());

  useEffect(() => {
    if (!isSuperAdminSession()) {
      router.replace('/superadmin/login');
      return;
    }
    load();
  }, [router]);

  const onToggle = (id: string) => {
    const res = togglePlatformBarbershopStatus(id);
    if (!res.ok) return toast(res.message);
    load();
    toast('Status atualizado.');
  };

  const onReset = (id: string) => {
    const ok = window.confirm('Resetar senha desta barbearia para 123456?');
    if (!ok) return;
    const res = resetPlatformBarbershopPassword(id);
    if (!res.ok) return toast(res.message);
    toast('Senha redefinida para 123456.');
  };

  const onDelete = (id: string) => {
    const ok = window.confirm('Excluir permanentemente esta barbearia?');
    if (!ok) return;
    const res = removePlatformBarbershop(id);
    if (!res.ok) return toast(res.message);
    load();
    toast('Barbearia excluída.');
  };

  return (
    <SuperAdminShell title="Barbearias da Plataforma" subtitle="Listagem, status e ações administrativas.">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => router.push('/superadmin/barbershops/new')}>Adicionar barbearia</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/superadmin/dashboard')}>Voltar ao dashboard</Button>
      </div>

      <div className="grid gap-2">
        {rows.map((shop) => (
          <article key={shop.id} className="grid gap-2 rounded-xl border border-borderc bg-slate-950/35 p-3 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
            <div className="grid gap-1">
              <strong>{shop.name}</strong>
              <small className="text-text-secondary">{shop.owner_name} · {shop.email} · {shop.phone}</small>
              <small className="text-text-secondary">Status: {shop.status === 'active' ? 'Ativa' : 'Desativada'}</small>
            </div>
            <small className="text-text-secondary">Criada em {new Date(shop.created_at).toLocaleDateString('pt-BR')}</small>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/superadmin/barbershops/${shop.id}/edit`)}>Editar</Button>
              <Button type="button" variant="outline" onClick={() => onToggle(shop.id)}>{shop.status === 'active' ? 'Desativar' : 'Ativar'}</Button>
              <Button type="button" variant="outline" onClick={() => onReset(shop.id)}>Reset senha</Button>
              <Button type="button" variant="destructive" onClick={() => onDelete(shop.id)}>Excluir</Button>
            </div>
          </article>
        ))}
        {!rows.length ? (
          <article className="rounded-xl border border-borderc bg-slate-950/35 p-4 text-sm text-text-secondary">
            Nenhuma barbearia cadastrada.
          </article>
        ) : null}
      </div>
    </SuperAdminShell>
  );
}
