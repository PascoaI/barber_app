'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useTheme } from '@/app/_components/ThemeProvider';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { brandColor } = useTheme();

  const loadProfile = useCallback(async () => {
    setLoading(true);

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
      console.error('loadProfile error:', error);
      setSaveStatus('error');
      setFeedback('❌ Não foi possível carregar seu perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loadProfile]);

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
        name: form.name,
        phone: form.phone,
        avatar_url: form.avatar_url || null,
        favorite_barber_id: form.favorite_barber_id || null,
        unit_id: form.unit_id || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase.from('users').update(payload).eq('id', user.id);
      if (updateError) throw updateError;

      await loadProfile();
      setSaveStatus('success');
      setFeedback('✅ Alterações salvas com sucesso.');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSaveStatus('idle');
        setFeedback('');
      }, 3000);
    } catch (error) {
      console.error('saveProfile error:', error);
      setSaveStatus('error');
      setFeedback('❌ Não foi possível salvar. Tente novamente.');
    }
  };

  return (
    <main className="page booking-page min-h-screen grid place-items-center p-4 md:p-8 bg-background text-text-primary font-sans py-4 md:py-8">
      <section className="booking-card w-full max-w-4xl rounded-2xl border border-borderc bg-surface shadow-soft p-4 md:p-8">
        <a className="back-link text-text-secondary hover:text-text-primary text-sm" href="client-home.html">
          ← Voltar
        </a>

        <div className="mb-5 border-b border-borderc pb-4">
          <h1 className="mb-2">Editar Perfil</h1>
          <p className="subtitle text-text-secondary">Atualize seus dados e preferências de atendimento.</p>
        </div>

        <form id="client-profile-form" className="grid gap-5" onSubmit={onSubmit}>
          <article className="rounded-xl border border-borderc bg-slate-900/40 p-4 grid gap-3">
            <h2 className="text-base">Dados pessoais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="profile-name" className="text-xs text-text-secondary">Nome</label>
                <input id="profile-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="profile-email" className="text-xs text-text-secondary">E-mail</label>
                <input id="profile-email" value={form.email} disabled />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="profile-phone" className="text-xs text-text-secondary">Telefone</label>
                <input id="profile-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="profile-avatar-url" className="text-xs text-text-secondary">Avatar URL</label>
                <input id="profile-avatar-url" value={form.avatar_url} onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))} />
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-borderc bg-slate-900/40 p-4 grid gap-3">
            <h2 className="text-base">Preferências</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="profile-favorite-barber" className="text-xs text-text-secondary">Barbeiro favorito</label>
                <input id="profile-favorite-barber" value={form.favorite_barber_id} onChange={(e) => setForm((f) => ({ ...f, favorite_barber_id: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="profile-default-unit" className="text-xs text-text-secondary">Unidade padrão</label>
                <input id="profile-default-unit" value={form.unit_id} onChange={(e) => setForm((f) => ({ ...f, unit_id: e.target.value }))} />
              </div>
            </div>
          </article>

          <div className="grid gap-2">
            <button className="button text-zinc-900" style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }} type="submit" disabled={loading || saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Salvando...' : 'Salvar'}
            </button>
            {feedback ? (
              <small style={{ color: saveStatus === 'success' ? '#60d394' : '#ff7b7b' }}>{feedback}</small>
            ) : (
              <small className="text-text-secondary">Cor da unidade ativa: <span style={{ color: brandColor }}>{brandColor}</span></small>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
