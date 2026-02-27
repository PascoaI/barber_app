'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useTheme } from '@/app/_components/ThemeProvider';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

type ProfileForm = {
  name: string;
  phone: string;
  avatar_url: string;
  email: string;
};

const initialForm: ProfileForm = {
  name: '',
  phone: '',
  avatar_url: '',
  email: ''
};

export default function ClientProfilePage() {
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        .select('id, email, name, phone, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setForm({
        name: profile?.name ?? '',
        phone: profile?.phone ?? '',
        avatar_url: profile?.avatar_url ?? '',
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

  const onAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback('❌ Selecione um arquivo de imagem válido.');
      setSaveStatus('error');
      return;
    }

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatar_url: String(reader.result || '') }));
      setAvatarUploading(false);
      setFeedback('📷 Pré-visualização atualizada. Clique em Salvar para confirmar.');
      setSaveStatus('idle');
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      setSaveStatus('error');
      setFeedback('❌ Não foi possível processar a imagem selecionada.');
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
      if (!user) throw new Error('Usuário não autenticado.');

      const payload = {
        name: form.name,
        phone: form.phone,
        avatar_url: form.avatar_url || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase.from('users').update(payload).eq('id', user.id);
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

  const initials = useMemo(() => {
    const trimmed = form.name.trim();
    if (!trimmed) return 'CL';
    return trimmed
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [form.name]);

  return (
    <main className="page booking-page min-h-screen bg-background text-text-primary font-sans py-6 px-4 md:px-8">
      <section className="w-full max-w-3xl mx-auto rounded-2xl border border-borderc bg-surface/95 shadow-soft p-4 md:p-8 grid gap-6">
        <header className="flex items-start justify-between gap-3 border-b border-borderc pb-4">
          <div>
            <a className="back-link text-text-secondary hover:text-text-primary text-sm" href="client-home">
              ← Voltar
            </a>
            <h1 className="mt-3 text-2xl md:text-3xl font-semibold">Perfil</h1>
            <p className="text-text-secondary text-sm md:text-base">Gerencie suas informações pessoais e sua foto de perfil.</p>
          </div>
          <div className="hidden md:block text-right text-xs text-text-secondary">
            Tema ativo
            <div style={{ color: brandColor }} className="font-semibold">{brandColor}</div>
          </div>
        </header>

        <form id="client-profile-form" className="grid gap-6" onSubmit={onSubmit}>
          <article className="rounded-2xl border border-borderc bg-slate-900/35 p-4 md:p-5 grid gap-5">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="w-24 h-24 rounded-full border border-borderc bg-slate-800 overflow-hidden grid place-items-center text-sm font-semibold">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Avatar do cliente" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="grid gap-2 text-center md:text-left">
                <h2 className="text-base font-semibold">Foto de perfil</h2>
                <p className="text-xs text-text-secondary">Envie uma imagem para personalizar sua conta.</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading || saveStatus === 'saving'}
                  >
                    {avatarUploading ? 'Processando...' : 'Enviar foto'}
                  </button>
                  {form.avatar_url ? (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setForm((prev) => ({ ...prev, avatar_url: '' }))}
                      disabled={saveStatus === 'saving'}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
                <input
                  ref={fileInputRef}
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarUpload}
                />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-borderc bg-slate-900/35 p-4 md:p-5 grid gap-4">
            <h2 className="text-base font-semibold">Dados pessoais</h2>
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
              disabled={loading || saveStatus === 'saving' || avatarUploading}
            >
              {saveStatus === 'saving' ? 'Salvando...' : 'Salvar perfil'}
            </button>
            {feedback ? (
              <small style={{ color: saveStatus === 'success' ? '#60d394' : saveStatus === 'error' ? '#ff7b7b' : '#9da8c3' }}>{feedback}</small>
            ) : (
              <small className="text-text-secondary">Suas alterações são aplicadas imediatamente após salvar.</small>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
