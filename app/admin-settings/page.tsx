'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmSaveModal from '@/app/_components/ConfirmSaveModal';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

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
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

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
      if (!['admin', 'super_admin'].includes(profile?.role ?? '')) {
        throw new Error('Acesso restrito para administradores.');
      }

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
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Erro ao carregar configurações.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Usuário não autenticado.');

      const payload = {
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

      const { error: updateError } = await supabase.from('unit_settings').update(payload).eq('unit_id', form.unit_id);
      if (updateError) throw updateError;

      setFeedback(null);
      await loadSettings();
      setIsOpen(true);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Erro ao salvar configurações.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page booking-page min-h-screen grid place-items-center p-4 md:p-8 bg-background text-text-primary font-sans py-4 md:py-8">
      <section className="booking-card w-full max-w-4xl rounded-2xl border border-borderc bg-surface shadow-soft p-4 md:p-8">
        <a className="back-link text-text-secondary hover:text-text-primary text-sm" href="admin-home.html">
          ← Dashboard
        </a>
        <h1>Configurações Gerais</h1>
        <p className="subtitle text-text-secondary leading-relaxed mt-2 mb-5">Configurações da unidade e branding.</p>

        <form id="admin-settings-form" className="auth-form grid gap-3" onSubmit={onSubmit}>
          <label htmlFor="shop-name">Nome da barbearia</label>
          <input id="shop-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

          <label htmlFor="shop-color">Cor principal</label>
          <input id="shop-color" type="color" value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} />

          <label htmlFor="shop-logo">Logo URL</label>
          <input id="shop-logo" value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} />

          <label htmlFor="us-opening-time">Abertura</label>
          <input id="us-opening-time" type="time" value={form.opening_time} onChange={(e) => setForm((f) => ({ ...f, opening_time: e.target.value }))} />

          <label htmlFor="us-closing-time">Fechamento</label>
          <input id="us-closing-time" type="time" value={form.closing_time} onChange={(e) => setForm((f) => ({ ...f, closing_time: e.target.value }))} />

          <label htmlFor="us-slot-interval">Intervalo dos slots (min)</label>
          <input id="us-slot-interval" type="number" min={5} step={5} value={form.slot_interval_minutes} onChange={(e) => setForm((f) => ({ ...f, slot_interval_minutes: Number(e.target.value) }))} />

          <label htmlFor="us-cancel-limit">Limite de cancelamento (horas)</label>
          <input id="us-cancel-limit" type="number" min={0} step={1} value={form.cancellation_limit_hours} onChange={(e) => setForm((f) => ({ ...f, cancellation_limit_hours: Number(e.target.value) }))} />

          <label className="checkbox-wrap inline-flex items-center gap-2 text-sm text-text-secondary">
            <input id="us-prepayment-enabled" type="checkbox" checked={form.prepayment_enabled} onChange={(e) => setForm((f) => ({ ...f, prepayment_enabled: e.target.checked }))} />
            <span>Pré-pagamento habilitado</span>
          </label>

          <button className="button button-primary" type="submit" disabled={loading || saving || !form.unit_id}>
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>

          {feedback && <small style={{ color: feedback.type === 'success' ? '#60d394' : '#ff7b7b' }}>{feedback.message}</small>}
        </form>
      </section>

      <ConfirmSaveModal
        isOpen={isOpen}
        title="Alterações salvas!"
        message="Configurações atualizadas com sucesso."
        onGoHome={() => router.push('/admin')}
        onStay={() => setIsOpen(false)}
        onClose={() => setIsOpen(false)}
      />
    </main>
  );
}
