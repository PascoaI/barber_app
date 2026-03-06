'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BarbershopInput } from '@/types/barbershop';

type Props = {
  initial?: Partial<BarbershopInput> & { password?: string };
  submitLabel: string;
  onSubmit: (data: BarbershopInput & { password?: string }) => Promise<void>;
  onCancel?: () => void;
};

type FormState = {
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  status: 'active' | 'disabled';
  plan: string;
};

export default function BarbershopForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name || '',
    owner_name: initial?.owner_name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    password: initial?.password || '',
    address: initial?.address || '',
    status: initial?.status === 'disabled' ? 'disabled' : 'active',
    plan: initial?.plan || 'starter'
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const title = useMemo(() => (submitLabel.toLowerCase().includes('atual') ? 'Editar barbearia' : 'Nova barbearia'), [submitLabel]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      await onSubmit({
        name: form.name,
        owner_name: form.owner_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        status: form.status as 'active' | 'disabled',
        plan: form.plan,
        plan_expires_at: null,
        password: form.password
      });
    } catch (error: any) {
      setFeedback(error?.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-borderc bg-slate-950/30 p-4">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-text-secondary">Preencha os dados da barbearia para disponibilizar acesso ao sistema.</p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="sb-name">Nome da barbearia</Label>
        <Input id="sb-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="sb-owner">Responsável</Label>
        <Input id="sb-owner" value={form.owner_name} onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))} required />
      </div>

      <div className="grid gap-1.5 md:grid-cols-2 md:gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="sb-email">Email</Label>
          <Input id="sb-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sb-phone">Telefone</Label>
          <Input id="sb-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
        </div>
      </div>

      <div className="grid gap-1.5 md:grid-cols-2 md:gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="sb-password">Senha inicial / reset</Label>
          <Input id="sb-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="123456" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sb-plan">Plano</Label>
          <select
            id="sb-plan"
            className="w-full min-h-11 rounded-xl border border-borderc bg-surface px-3 text-sm text-text-primary"
            value={form.plan}
            onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
          >
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
          </select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="sb-address">Endereço (opcional)</Label>
        <Input id="sb-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="sb-status">Status</Label>
        <select
          id="sb-status"
          className="w-full min-h-11 rounded-xl border border-borderc bg-surface px-3 text-sm text-text-primary"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: (e.target.value === 'disabled' ? 'disabled' : 'active') }))}
        >
          <option value="active">Ativa</option>
          <option value="disabled">Desativada</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : submitLabel}</Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        ) : null}
      </div>

      {feedback ? <small className="text-red-300">{feedback}</small> : null}
    </form>
  );
}
