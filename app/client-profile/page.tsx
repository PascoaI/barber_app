'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type ProfileForm = {
  name: string;
  phone: string;
  avatar_url: string;
  favorite_barber_id: string;
  unit_id: string;
  email: string;
};

const initialForm: ProfileForm = {
  name: '',
  phone: '',
  avatar_url: '',
  favorite_barber_id: '',
  unit_id: '',
  email: ''
};

export default function ClientProfilePage() {
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadProfile = useCallback(async () => {
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
        .select('id, email, name, phone, avatar_url, favorite_barber_id, unit_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setForm({
        name: profile?.name ?? '',
        phone: profile?.phone ?? '',
        avatar_url: profile?.avatar_url ?? '',
        favorite_barber_id: profile?.favorite_barber_id ?? '',
        unit_id: profile?.unit_id ?? '',
        email: profile?.email ?? user.email ?? ''
      });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Erro ao carregar perfil.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

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
        phone: form.phone,
        avatar_url: form.avatar_url || null,
        favorite_barber_id: form.favorite_barber_id || null,
        unit_id: form.unit_id || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase.from('users').update(payload).eq('id', user.id);
      if (updateError) throw updateError;

      setFeedback({ type: 'success', message: 'Perfil salvo com sucesso.' });
      await loadProfile();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Erro ao salvar perfil.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page booking-page min-h-screen grid place-items-center p-4 md:p-8 bg-background text-text-primary font-sans py-4 md:py-8">
      <section className="booking-card w-full max-w-3xl rounded-2xl border border-borderc bg-surface shadow-soft p-4 md:p-8">
        <a className="back-link text-text-secondary hover:text-text-primary text-sm" href="client-home.html">
          ← Voltar
        </a>
        <h1 className="mb-4">Meu perfil</h1>

        <form id="client-profile-form" className="auth-form grid gap-3" onSubmit={onSubmit}>
          <label htmlFor="profile-name">Nome</label>
          <input id="profile-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />

          <label htmlFor="profile-email">E-mail</label>
          <input id="profile-email" value={form.email} disabled />

          <label htmlFor="profile-phone">Telefone</label>
          <input id="profile-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />

          <label htmlFor="profile-avatar-url">Avatar URL</label>
          <input id="profile-avatar-url" value={form.avatar_url} onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))} />

          <label htmlFor="profile-favorite-barber">Profissional favorito</label>
          <input id="profile-favorite-barber" value={form.favorite_barber_id} onChange={(e) => setForm((f) => ({ ...f, favorite_barber_id: e.target.value }))} />

          <label htmlFor="profile-default-unit">Unidade padrão</label>
          <input id="profile-default-unit" value={form.unit_id} onChange={(e) => setForm((f) => ({ ...f, unit_id: e.target.value }))} />

          <button className="button button-primary" type="submit" disabled={loading || saving}>
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </button>

          {feedback && <small style={{ color: feedback.type === 'success' ? '#60d394' : '#ff7b7b' }}>{feedback.message}</small>}
        </form>
      </section>
    </main>
  );
}
