'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

type ProfileForm = {
  name: string;
  phone: string;
  email: string;
};

const initialForm: ProfileForm = {
  name: '',
  phone: '',
  email: ''
};

export default function ClientProfilePage() {
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        .select('id, email, name, phone')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setForm({
        name: profile?.name ?? '',
        phone: profile?.phone ?? '',
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

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: form.name,
          phone: form.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await loadProfile();
      setSaveStatus('success');
      setFeedback('✅ Perfil atualizado com sucesso.');
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
    <main className="page booking-page min-h-screen bg-background text-text-primary font-sans py-6 px-4 md:px-8">
      <section className="w-full max-w-2xl mx-auto rounded-2xl border border-borderc bg-surface shadow-soft p-4 md:p-8 grid gap-6">
        <header className="border-b border-borderc pb-4">
          <a className="back-link text-text-secondary hover:text-text-primary text-sm" href="client-home">
            ← Voltar
          </a>
          <h1 className="mt-3 text-2xl md:text-3xl font-semibold">Perfil</h1>
          <p className="text-text-secondary text-sm md:text-base">Atualize seus dados de contato.</p>
        </header>

        <form id="client-profile-form" className="grid gap-5" onSubmit={onSubmit}>
          <article className="rounded-2xl border border-borderc bg-slate-900/35 p-4 md:p-5 grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label htmlFor="profile-name" className="grid gap-1.5">
                <span className="text-xs text-text-secondary">Nome</span>
                <input
                  id="profile-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>

              <label htmlFor="profile-email" className="grid gap-1.5">
                <span className="text-xs text-text-secondary">E-mail</span>
                <input id="profile-email" value={form.email} disabled />
              </label>

              <label htmlFor="profile-phone" className="grid gap-1.5 md:col-span-2">
                <span className="text-xs text-text-secondary">Telefone</span>
                <input
                  id="profile-phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </label>
            </div>
          </article>

          <div className="grid gap-2">
            <button
              className="button text-zinc-900"
              style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
              type="submit"
              disabled={loading || saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Salvando...' : 'Salvar perfil'}
            </button>
            {feedback ? (
              <small style={{ color: saveStatus === 'success' ? '#60d394' : '#ff7b7b' }}>{feedback}</small>
            ) : (
              <small className="text-text-secondary">Você pode alterar apenas nome e telefone nesta etapa.</small>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
