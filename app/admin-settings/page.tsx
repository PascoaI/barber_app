'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useTheme } from '@/app/_components/ThemeProvider';

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
  const [form, setForm] = useState<UnitSettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { setBrandColor, brandColor } = useTheme();

  const loadSettings = useCallback(async () => {
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Usuário não autenticado.');

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, role, unit_id')
        .eq('id', user.id)
        .single();

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
        name: unit?.name ?? '',
        primary_color: unit?.primary_color ?? '#c69a45',
        logo_url: unit?.logo_url ?? '',
        opening_time: unit?.opening_time ?? '09:00',
        closing_time: unit?.closing_time ?? '20:00',
        slot_interval_minutes: Number(unit?.slot_interval_minutes ?? 30),
        cancellation_limit_hours: Number(unit?.cancellation_limit_hours ?? 3),
        prepayment_enabled: Boolean(unit?.prepayment_enabled),
        unit_id: unitId
      };

      setForm(next);
      if (next.primary_color) setBrandColor(next.primary_color);
    } catch (error) {
      console.error('loadSettings error:', error);
      setSaveStatus('error');
      setFeedback('❌ Não foi possível carregar configurações.');
    } finally {
      setLoading(false);
    }
  }, [setBrandColor]);

  useEffect(() => {
    void loadSettings();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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

      setBrandColor(form.primary_color);
      await loadSettings();
      setSaveStatus('success');
      setFeedback('✅ Alterações salvas com sucesso.');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSaveStatus('idle');
        setFeedback('');
      }, 3000);
    } catch (error) {
      console.error('saveSettings error:', error);
      setSaveStatus('error');
      setFeedback('❌ Não foi possível salvar. Tente novamente.');
    }
  };

  return (
    <main className="page booking-page min-h-screen grid place-items-center p-4 md:p-8 bg-background text-text-primary font-sans py-4 md:py-8">
      <section className="booking-card w-full max-w-6xl rounded-2xl border border-borderc bg-surface shadow-soft p-4 md:p-8">
        <a className="back-link text-text-secondary hover:text-text-primary text-sm" href="admin-home.html">← Dashboard</a>
        <div className="mb-5 border-b border-borderc pb-4">
          <h1 className="mb-2">Configurações da Barbearia</h1>
          <p className="subtitle text-text-secondary">Atualize branding, aparência e regras da unidade.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
          <form id="admin-settings-form" className="grid gap-4" onSubmit={onSubmit}>
            <article className="rounded-xl border border-borderc bg-slate-900/40 p-4 grid gap-3">
              <h2 className="text-base">Branding</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label htmlFor="shop-name" className="text-xs text-text-secondary">Nome da barbearia</label>
                  <input id="shop-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="shop-logo" className="text-xs text-text-secondary">Logo URL</label>
                  <input id="shop-logo" value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} />
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-borderc bg-slate-900/40 p-4 grid gap-3">
              <h2 className="text-base">Aparência</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label htmlFor="shop-color" className="text-xs text-text-secondary">Cor predominante</label>
                  <input id="shop-color" type="color" value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} className="h-11" />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="shop-color-hex" className="text-xs text-text-secondary">Hex da cor</label>
                  <input id="shop-color-hex" value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} placeholder="#c69a45" />
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-borderc bg-slate-900/40 p-4 grid gap-3">
              <h2 className="text-base">Agenda e política</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-1.5"><label htmlFor="us-opening-time" className="text-xs text-text-secondary">Abertura</label><input id="us-opening-time" type="time" value={form.opening_time} onChange={(e) => setForm((f) => ({ ...f, opening_time: e.target.value }))} /></div>
                <div className="grid gap-1.5"><label htmlFor="us-closing-time" className="text-xs text-text-secondary">Fechamento</label><input id="us-closing-time" type="time" value={form.closing_time} onChange={(e) => setForm((f) => ({ ...f, closing_time: e.target.value }))} /></div>
                <div className="grid gap-1.5"><label htmlFor="us-slot-interval" className="text-xs text-text-secondary">Intervalo slots (min)</label><input id="us-slot-interval" type="number" min={5} step={5} value={form.slot_interval_minutes} onChange={(e) => setForm((f) => ({ ...f, slot_interval_minutes: Number(e.target.value) }))} /></div>
                <div className="grid gap-1.5"><label htmlFor="us-cancel-limit" className="text-xs text-text-secondary">Limite cancelamento (h)</label><input id="us-cancel-limit" type="number" min={0} step={1} value={form.cancellation_limit_hours} onChange={(e) => setForm((f) => ({ ...f, cancellation_limit_hours: Number(e.target.value) }))} /></div>
              </div>
              <label className="checkbox-wrap inline-flex items-center gap-2 text-sm text-text-secondary">
                <input id="us-prepayment-enabled" type="checkbox" checked={form.prepayment_enabled} onChange={(e) => setForm((f) => ({ ...f, prepayment_enabled: e.target.checked }))} />
                <span>Pré-pagamento habilitado</span>
              </label>
            </article>

            <div className="grid gap-2">
              <button className="button text-zinc-900" style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }} type="submit" disabled={loading || saveStatus === 'saving' || !form.unit_id}>
                {saveStatus === 'saving' ? 'Salvando...' : 'Salvar'}
              </button>
              {feedback ? (
                <small style={{ color: saveStatus === 'success' ? '#60d394' : '#ff7b7b' }}>{feedback}</small>
              ) : (
                <small className="text-text-secondary">Tema ativo: <span style={{ color: brandColor }}>{brandColor}</span></small>
              )}
            </div>
          </form>

          <aside className="rounded-xl border border-borderc bg-slate-900/40 p-4 grid gap-3 h-fit">
            <h2 className="text-base">Preview</h2>
            <article className="rounded-xl border border-borderc p-4 grid gap-3" style={{ boxShadow: `0 0 0 1px ${form.primary_color}33 inset` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-borderc overflow-hidden bg-slate-800">
                  {form.logo_url ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" /> : null}
                </div>
                <div>
                  <strong>{form.name || 'Nome da Barbearia'}</strong>
                  <p className="text-text-secondary text-sm">Visual da marca</p>
                </div>
              </div>
              <button type="button" className="button text-zinc-900" style={{ backgroundColor: form.primary_color, borderColor: form.primary_color }}>
                Botão primário
              </button>
              <small className="text-text-secondary">A cor é aplicada imediatamente após salvar.</small>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
