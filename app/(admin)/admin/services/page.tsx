'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { withCsrfHeaders } from '@/lib/security/csrf-client';

type ServiceRow = {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  active: boolean;
};

const initialForm = { name: '', description: '', duration_minutes: '30', price: '45' };

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    const response = await fetch('/api/admin/services', { cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) throw new Error(result?.message || 'Falha ao carregar servicos.');
    setRows(result.rows || []);
  };

  useEffect(() => {
    void load().catch((error) => toast(error.message));
  }, [toast]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/admin/services', withCsrfHeaders({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        duration_minutes: Number(form.duration_minutes),
        price: Number(form.price)
      })
    }));
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) return toast(result?.message || 'Falha ao salvar servico.');
    setForm(initialForm);
    await load();
    toast('Servico salvo.');
  };

  const toggleActive = async (row: ServiceRow) => {
    const response = await fetch(`/api/admin/services/${encodeURIComponent(row.id)}`, withCsrfHeaders({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, active: !row.active })
    }));
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) return toast(result?.message || 'Falha ao atualizar servico.');
    await load();
    toast('Servico atualizado.');
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-borderc/80 bg-slate-950/70">
        <CardHeader>
          <CardTitle>Novo servico</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="service-name">Nome</Label>
              <Input id="service-name" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="service-description">Descricao</Label>
              <Input id="service-description" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
            </div>
            <div className="grid gap-1.5 md:grid-cols-2 md:gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="service-duration">Duracao (min)</Label>
                <Input id="service-duration" type="number" min="5" value={form.duration_minutes} onChange={(e) => setForm((current) => ({ ...current, duration_minutes: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="service-price">Preco</Label>
                <Input id="service-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))} />
              </div>
            </div>
            <Button type="submit">Salvar servico</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-borderc/80 bg-slate-950/70">
        <CardHeader>
          <CardTitle>Catalogo do tenant</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {rows.map((row) => (
            <article key={row.id} className="grid gap-3 rounded-2xl border border-borderc bg-slate-950/35 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="grid gap-1">
                <strong>{row.name}</strong>
                <small className="text-text-secondary">{row.description || 'Sem descricao'}</small>
                <small className="text-text-secondary">{row.duration_minutes} min • R$ {Number(row.price || 0).toFixed(2)}</small>
              </div>
              <Button type="button" variant="outline" onClick={() => toggleActive(row)}>
                {row.active ? 'Desativar' : 'Ativar'}
              </Button>
            </article>
          ))}
          {!rows.length ? <small className="text-text-secondary">Nenhum servico cadastrado.</small> : null}
        </CardContent>
      </Card>
    </div>
  );
}
