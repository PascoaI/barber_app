'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, House, LogOut, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
type ProfileForm = { name: string; phone: string; email: string };

const initialForm: ProfileForm = { name: '', phone: '', email: '' };

export default function ClientProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error('Usuario nao autenticado.');

      const { data: profile, error: profileError } = await supabase.from('users').select('id, email, name, phone').eq('id', user.id).single();
      if (profileError) throw profileError;

      setForm({
        name: profile?.name ?? '',
        phone: profile?.phone ?? '',
        email: profile?.email ?? user.email ?? ''
      });
    } catch (error) {
      console.error('loadProfile error:', error);
      setSaveStatus('error');
      setFeedback('Nao foi possivel carregar seu perfil.');
      toast('Nao foi possivel carregar seu perfil.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
      if (!user) throw new Error('Usuario nao autenticado.');

      const { error: updateError } = await supabase.from('users').update({ name: form.name, phone: form.phone, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (updateError) throw updateError;

      await loadProfile();
      setSaveStatus('success');
      setFeedback('Perfil atualizado com sucesso.');
      toast('Perfil salvo com sucesso.');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSaveStatus('idle');
        setFeedback('');
      }, 3000);
    } catch (error) {
      console.error('saveProfile error:', error);
      setSaveStatus('error');
      setFeedback('Nao foi possivel salvar. Tente novamente.');
      toast('Erro ao salvar perfil.');
    }
  };

  const initials = useMemo(() => {
    const raw = form.name || 'Cliente';
    const parts = raw.split(' ').filter(Boolean).slice(0, 2);
    const letters = parts.map((p) => p[0]).join('').toUpperCase();
    return letters || 'CL';
  }, [form.name]);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4">
      <Card className="overflow-hidden border-borderc/80 bg-gradient-to-br from-slate-950/75 via-slate-900/70 to-slate-950/80">
        <CardHeader className="grid gap-4 border-b border-borderc/70">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="inline-flex items-center gap-2" onClick={() => router.push('/client/home')}>
                <House className="h-4 w-4" /> Home
              </Button>
              <Button type="button" variant="outline" className="inline-flex items-center gap-2" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            </div>
            <Button type="button" variant="destructive" className="inline-flex items-center gap-2" onClick={() => router.push('/login')}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>

          <div className="grid gap-1.5">
            <CardTitle>Meu perfil</CardTitle>
            <p className="text-sm text-text-secondary">Atualize seus dados para facilitar confirmacoes de agendamento e comunicacoes.</p>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 md:grid-cols-[0.9fr_1.2fr] md:p-6">
          <article className="grid content-start gap-3 rounded-2xl border border-borderc bg-slate-950/35 p-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-primary/45 bg-primary/20 text-text-primary">
              <span className="text-base font-bold">{initials}</span>
            </div>
            <div className="grid gap-1">
              <strong className="text-base text-text-primary">{form.name || 'Cliente'}</strong>
              <p className="break-all text-sm text-text-secondary">{form.email || 'cliente@barber.com'}</p>
            </div>
            <div className="inline-flex w-fit rounded-full border border-borderc bg-slate-900/55 px-3 py-1 text-xs text-text-secondary">
              <UserRound className="mr-1 h-3.5 w-3.5" /> Conta ativa
            </div>
            <Badge>{saveStatus === 'saving' ? 'Salvando' : loading ? 'Carregando' : 'Pronto'}</Badge>
          </article>

          <form id="client-profile-form" className="grid gap-3 rounded-2xl border border-borderc bg-slate-950/30 p-4" onSubmit={onSubmit}>
            <Label htmlFor="profile-name">Nome</Label>
            <Input id="profile-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />

            <Label htmlFor="profile-email">E-mail</Label>
            <Input id="profile-email" value={form.email} disabled />

            <Label htmlFor="profile-phone">Telefone</Label>
            <Input id="profile-phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(00) 00000-0000" />

            <Button type="submit" disabled={loading || saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Salvando...' : 'Salvar perfil'}
            </Button>

            {feedback ? <small className="text-text-secondary">{feedback}</small> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
