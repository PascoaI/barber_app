'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useTheme } from '@/app/_components/ThemeProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  name: '', primary_color: '#c69a45', logo_url: '', opening_time: '09:00', closing_time: '20:00', slot_interval_minutes: 30, cancellation_limit_hours: 3, prepayment_enabled: false, unit_id: ''
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<UnitSettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { setBrandColor, brandColor } = useTheme();
  const { toast } = useToast();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Usuário não autenticado.');

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

      const next = {
        name: unit?.name ?? '', primary_color: unit?.primary_color ?? '#c69a45', logo_url: unit?.logo_url ?? '', opening_time: unit?.opening_time ?? '09:00', closing_time: unit?.closing_time ?? '20:00', slot_interval_minutes: Number(unit?.slot_interval_minutes ?? 30), cancellation_limit_hours: Number(unit?.cancellation_limit_hours ?? 3), prepayment_enabled: Boolean(unit?.prepayment_enabled), unit_id: unitId
      };
      setForm(next);
      if (next.primary_color) setBrandColor(next.primary_color);
    } catch (error) {
      console.error('loadSettings error:', error);
      setSaveStatus('error');
      setFeedback('❌ Não foi possível carregar configurações.');
      toast('Falha ao carregar configurações.');
    } finally { setLoading(false); }
  }, [setBrandColor, toast]);

  useEffect(() => {
    void loadSettings();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [loadSettings]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    setFeedback('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Usuário não autenticado.');

      const payload = { unit_id: form.unit_id, name: form.name, primary_color: form.primary_color, logo_url: form.logo_url || null, opening_time: form.opening_time, closing_time: form.closing_time, slot_interval_minutes: Number(form.slot_interval_minutes), cancellation_limit_hours: Number(form.cancellation_limit_hours), prepayment_enabled: Boolean(form.prepayment_enabled), updated_at: new Date().toISOString(), updated_by: user.id };

      const { error: upsertError } = await supabase.from('unit_settings').upsert(payload, { onConflict: 'unit_id' }).execute();
      if (upsertError) throw upsertError;

      setBrandColor(form.primary_color);
      await loadSettings();
      setSaveStatus('success');
      setFeedback('✅ Alterações salvas com sucesso.');
      toast('Configurações salvas!');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { setSaveStatus('idle'); setFeedback(''); }, 3000);
    } catch (error) {
      console.error('saveSettings error:', error);
      setSaveStatus('error');
      setFeedback('❌ Não foi possível salvar configurações.');
      toast('Erro ao salvar configurações.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Admin Settings</CardTitle>
            <p className="text-sm text-text-secondary">Refatorado com Tabs, Cards e previews visuais.</p>
          </div>
          <Badge>{loading ? 'Carregando' : 'Pronto'}</Badge>
        </CardHeader>
        <CardContent>
          <form id="admin-settings-form" onSubmit={onSubmit} className="grid gap-5">
            <Tabs defaultValue="branding">
              <TabsList>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="appearance">Aparência</TabsTrigger>
                <TabsTrigger value="others">Outros</TabsTrigger>
              </TabsList>

              <TabsContent value="branding" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="shop-name">Nome</Label>
                  <Input id="shop-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="shop-logo">Logo URL</Label>
                  <Input id="shop-logo" value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} />
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="shop-color">Cor predominante</Label>
                  <Input id="shop-color" type="color" value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} className="h-11" />
                </div>
                <div className="rounded-xl border border-borderc p-4 grid gap-2">
                  <small className="text-text-secondary">Preview de cor</small>
                  <div className="h-10 rounded-lg" style={{ background: form.primary_color }} />
                  <small className="text-text-secondary">Tema ativo: <span style={{ color: brandColor }}>{brandColor}</span></small>
                </div>
              </TabsContent>

              <TabsContent value="others" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label htmlFor="us-opening-time">Abertura</Label><Input id="us-opening-time" type="time" value={form.opening_time} onChange={(e) => setForm((f) => ({ ...f, opening_time: e.target.value }))} /></div>
                <div className="grid gap-1.5"><Label htmlFor="us-closing-time">Fechamento</Label><Input id="us-closing-time" type="time" value={form.closing_time} onChange={(e) => setForm((f) => ({ ...f, closing_time: e.target.value }))} /></div>
                <div className="grid gap-1.5"><Label htmlFor="us-slot-interval">Intervalo slots (min)</Label><Input id="us-slot-interval" type="number" min={5} step={5} value={form.slot_interval_minutes} onChange={(e) => setForm((f) => ({ ...f, slot_interval_minutes: Number(e.target.value) }))} /></div>
                <div className="grid gap-1.5"><Label htmlFor="us-cancel-limit">Limite cancelamento (h)</Label><Input id="us-cancel-limit" type="number" min={0} step={1} value={form.cancellation_limit_hours} onChange={(e) => setForm((f) => ({ ...f, cancellation_limit_hours: Number(e.target.value) }))} /></div>
              </TabsContent>
            </Tabs>

            <Button type="submit" disabled={loading || saveStatus === 'saving' || !form.unit_id}>{saveStatus === 'saving' ? 'Salvando...' : 'Salvar'}</Button>
            {feedback ? <small className="text-text-secondary">{feedback}</small> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
