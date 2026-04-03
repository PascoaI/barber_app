'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { withCsrfHeaders } from '@/lib/security/csrf-client';

type TenantSettingsResponse = {
  ok: boolean;
  tenant?: { id: string; slug: string; status: string };
  settings?: {
    tenant_id: string;
    barbershop_name: string;
    logo_url?: string | null;
    branding_primary: string;
    branding_secondary: string;
    business_hours: Record<string, { enabled: boolean; open: string; close: string }>;
  };
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tenantSlug, setTenantSlug] = useState('');
  const [form, setForm] = useState({
    tenant_id: '',
    barbershop_name: '',
    logo_url: '',
    branding_primary: '#c69a45',
    branding_secondary: '#0f172a'
  });

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tenant', { cache: 'no-store' });
      const result = (await response.json().catch(() => ({}))) as TenantSettingsResponse;
      if (!response.ok || !result?.ok || !result.settings) {
        throw new Error((result as any)?.message || 'Falha ao carregar configuracoes.');
      }

      setTenantSlug(result.tenant?.slug || '');
      setForm({
        tenant_id: result.settings.tenant_id,
        barbershop_name: result.settings.barbershop_name || '',
        logo_url: result.settings.logo_url || '',
        branding_primary: result.settings.branding_primary || '#c69a45',
        branding_secondary: result.settings.branding_secondary || '#0f172a'
      });
    } catch (error: any) {
      toast(error?.message || 'Falha ao carregar configuracoes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/admin/tenant', withCsrfHeaders({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    }));
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) return toast(result?.message || 'Falha ao salvar configuracoes.');
    toast('Configuracoes salvas.');
    await load();
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-borderc/80 bg-slate-950/70">
        <CardHeader>
          <CardTitle>Branding e operacao</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
            <small className="text-text-secondary">Slug do tenant</small>
            <p className="text-base font-semibold">{tenantSlug || 'nao definido'}</p>
          </div>
          <div className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
            <small className="text-text-secondary">Preview visual</small>
            <div className="mt-3 rounded-2xl border border-borderc p-4" style={{ background: `linear-gradient(135deg, ${form.branding_secondary}, ${form.branding_primary})` }}>
              <strong className="block text-white">{form.barbershop_name || 'Sua barbearia'}</strong>
              <small className="text-slate-200">Tema escuro mantido com branding por tenant.</small>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-borderc/80 bg-slate-950/70">
        <CardHeader>
          <CardTitle>Configuracoes do tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tenant-name">Nome da barbearia</Label>
              <Input id="tenant-name" value={form.barbershop_name} onChange={(e) => setForm((current) => ({ ...current, barbershop_name: e.target.value }))} disabled={loading} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tenant-logo">Logo URL</Label>
              <Input id="tenant-logo" value={form.logo_url} onChange={(e) => setForm((current) => ({ ...current, logo_url: e.target.value }))} disabled={loading} />
            </div>
            <div className="grid gap-1.5 md:grid-cols-2 md:gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="tenant-primary">Cor primaria</Label>
                <Input id="tenant-primary" value={form.branding_primary} onChange={(e) => setForm((current) => ({ ...current, branding_primary: e.target.value }))} disabled={loading} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tenant-secondary">Cor secundaria</Label>
                <Input id="tenant-secondary" value={form.branding_secondary} onChange={(e) => setForm((current) => ({ ...current, branding_secondary: e.target.value }))} disabled={loading} />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              Salvar configuracoes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
