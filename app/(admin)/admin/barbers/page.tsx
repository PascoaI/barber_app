'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { withCsrfHeaders } from '@/lib/security/csrf-client';

type BarberRow = {
  id: string;
  name: string;
  phone?: string | null;
  photo_url?: string | null;
  active: boolean;
};

const initialForm = { name: '', phone: '', photo_url: '' };

export default function AdminBarbersPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<BarberRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const response = await fetch('/api/admin/barbers', { cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) throw new Error(result?.message || 'Falha ao carregar equipe.');
    setRows(result.rows || []);
  };

  useEffect(() => {
    void load().catch((error) => toast(error.message));
  }, [toast]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/barbers', withCsrfHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      }));
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error(result?.message || 'Falha ao salvar barbeiro.');
      setForm(initialForm);
      await load();
      toast('Barbeiro salvo.');
    } catch (error: any) {
      toast(error?.message || 'Falha ao salvar barbeiro.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: BarberRow) => {
    const response = await fetch(`/api/admin/barbers/${encodeURIComponent(row.id)}`, withCsrfHeaders({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, active: !row.active })
    }));
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) return toast(result?.message || 'Falha ao atualizar barbeiro.');
    await load();
    toast('Equipe atualizada.');
  };

  const removeRow = async (row: BarberRow) => {
    const response = await fetch(`/api/admin/barbers/${encodeURIComponent(row.id)}`, withCsrfHeaders({ method: 'DELETE' }));
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) return toast(result?.message || 'Falha ao remover barbeiro.');
    await load();
    toast('Barbeiro removido.');
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-borderc/80 bg-slate-950/70">
        <CardHeader>
          <CardTitle>Adicionar barbeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="barber-name">Nome</Label>
              <Input id="barber-name" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="barber-phone">Telefone</Label>
              <Input id="barber-phone" value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="barber-photo">URL da foto</Label>
              <Input id="barber-photo" value={form.photo_url} onChange={(e) => setForm((current) => ({ ...current, photo_url: e.target.value }))} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar barbeiro'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-borderc/80 bg-slate-950/70">
        <CardHeader>
          <CardTitle>Equipe do tenant</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {rows.map((row) => (
            <article key={row.id} className="grid gap-3 rounded-2xl border border-borderc bg-slate-950/35 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="grid gap-1">
                <strong>{row.name}</strong>
                <small className="text-text-secondary">{row.phone || 'Sem telefone informado'}</small>
                <small className={row.active ? 'text-emerald-300' : 'text-red-300'}>
                  {row.active ? 'Ativo na agenda' : 'Inativo'}
                </small>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => toggleActive(row)}>
                  {row.active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button type="button" variant="destructive" onClick={() => removeRow(row)}>
                  Excluir
                </Button>
              </div>
            </article>
          ))}

          {!rows.length ? <small className="text-text-secondary">Nenhum barbeiro cadastrado para este tenant.</small> : null}
        </CardContent>
      </Card>
    </div>
  );
}
