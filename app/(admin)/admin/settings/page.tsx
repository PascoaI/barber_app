'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, House, ImagePlus, LayoutDashboard, LogOut } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

type UnitSettingsForm = {
  name: string;
  primary_color: string;
  logo_url: string;
  opening_time: string;
  closing_time: string;
  slot_interval_minutes: number;
  cancellation_limit_hours: number;
  prepayment_enabled: boolean;
  unit_id: string;
};

const initialForm: UnitSettingsForm = {
  name: '',
  primary_color: '#c69a45',
  logo_url: '',
  opening_time: '09:00',
  closing_time: '20:00',
  slot_interval_minutes: 30,
  cancellation_limit_hours: 3,
  prepayment_enabled: false,
  unit_id: ''
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<UnitSettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const [fileLabel, setFileLabel] = useState('Nenhum arquivo selecionado');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Usuario nao autenticado.');

      const { data: profile, error: profileError } = await supabase.from('users').select('id, role, unit_id').eq('id', user.id).single();
      if (profileError) throw profileError;
      if (!['admin', 'super_admin'].includes(profile?.role ?? '')) throw new Error('Acesso restrito para administradores.');
      const unitId = profile?.unit_id;
      if (!unitId) throw new Error('Admin sem unit_id vinculado.');

      const { data: unit, error: unitError } = await supabase
        .from('unit_settings')
        .select('unit_id, name, primary_color, logo_url, opening_time, closing_time, slot_interval_minutes, cancellation_limit_hours, prepayment_enabled')
        .eq('unit_id', unitId)
        .single();
      if (unitError) throw unitError;

      setForm({
        name: unit?.name ?? '',
        primary_color: unit?.primary_color ?? '#c69a45',
        logo_url: unit?.logo_url ?? '',
        opening_time: unit?.opening_time ?? '09:00',
        closing_time: unit?.closing_time ?? '20:00',
        slot_interval_minutes: Number(unit?.slot_interval_minutes ?? 30),
        cancellation_limit_hours: Number(unit?.cancellation_limit_hours ?? 3),
        prepayment_enabled: Boolean(unit?.prepayment_enabled),
        unit_id: unitId
      });
    } catch (error) {
      console.error('loadSettings error:', error);
      setSaveStatus('error');
      setFeedback('Nao foi possivel carregar configuracoes.');
      toast('Falha ao carregar configuracoes.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSettings();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loadSettings]);

  const handleLogoPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileLabel(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logo_url: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    setFeedback('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Usuario nao autenticado.');

      const payload = {
        unit_id: form.unit_id,
        name: form.name,
        primary_color: form.primary_color,
        logo_url: form.logo_url || null,
        opening_time: form.opening_time,
        closing_time: form.closing_time,
        slot_interval_minutes: Number(form.slot_interval_minutes),
        cancellation_limit_hours: Number(form.cancellation_limit_hours),
        prepayment_enabled: Boolean(form.prepayment_enabled),
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };

      const { error: upsertError } = await supabase.from('unit_settings').upsert(payload, { onConflict: 'unit_id' }).execute();
      if (upsertError) throw upsertError;

      await loadSettings();
      setSaveStatus('success');
      setFeedback('Configuracoes salvas com sucesso.');
      toast('Configuracoes salvas.');

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSaveStatus('idle');
        setFeedback('');
      }, 3000);
    } catch (error) {
      console.error('saveSettings error:', error);
      setSaveStatus('error');
      setFeedback('Nao foi possivel salvar configuracoes.');
      toast('Erro ao salvar configuracoes.');
    }
  };

  const handleLogout = async () => {
    router.push('/login');
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4">
      <Card className="overflow-hidden border-borderc/80 bg-gradient-to-br from-slate-950/75 via-slate-900/70 to-slate-950/80">
        <CardHeader className="grid gap-4 border-b border-borderc/70">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="inline-flex items-center gap-2" onClick={() => router.push('/')}>
                <House className="h-4 w-4" /> Home
              </Button>
              <Button type="button" variant="outline" className="inline-flex items-center gap-2" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button type="button" variant="outline" className="inline-flex items-center gap-2" onClick={() => router.push('/admin/home')}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </div>
            <Button type="button" variant="destructive" className="inline-flex items-center gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>

          <div>
            <CardTitle>Configuracoes administrativas</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">Defina apenas o nome e a logo da unidade para exibir na home do cliente.</p>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_1.3fr] md:p-6">
          <div className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
            <p className="text-xs uppercase tracking-wide text-text-secondary">Pre-visualizacao</p>
            <div className="mt-3 grid gap-3">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-dashed border-borderc bg-slate-950/50">
                {form.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo_url} alt="Logo da barbearia" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-text-secondary">Logo</span>
                )}
              </div>
              <strong className="text-base text-text-primary">{form.name || 'BarberPro'}</strong>
              <p className="text-sm text-text-secondary">A marca acima e exibida no painel do cliente.</p>
            </div>
          </div>

          <form id="admin-settings-form" onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-borderc bg-slate-950/30 p-4">
            <Label htmlFor="shop-name">Nome da barbearia</Label>
            <Input
              id="shop-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex.: Barbearia XZ"
              required
            />

            <Label>Logo da barbearia</Label>
            <input ref={fileInputRef} id="shop-logo-file" type="file" accept="image/*" className="hidden" onChange={handleLogoPick} />
            <Button type="button" variant="outline" className="inline-flex items-center justify-center gap-2" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Selecionar arquivo da logo
            </Button>
            <small className="text-text-secondary">{fileLabel}</small>

            <Button type="submit" disabled={loading || saveStatus === 'saving' || !form.unit_id}>
              {saveStatus === 'saving' ? 'Salvando...' : 'Salvar configuracoes'}
            </Button>

            {feedback ? <small className="text-text-secondary">{feedback}</small> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
