'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
type ProfileForm = { name: string; phone: string; email: string };

const initialForm: ProfileForm = { name: '', phone: '', email: '' };

export default function ClientProfilePage() {
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
      if (!user) throw new Error('Usuário não autenticado.');

      const { data: profile, error: profileError } = await supabase.from('users').select('id, email, name, phone').eq('id', user.id).single();
      if (profileError) throw profileError;

      setForm({ name: profile?.name ?? '', phone: profile?.phone ?? '', email: profile?.email ?? user.email ?? '' });
    } catch (error) {
      console.error('loadProfile error:', error);
      setSaveStatus('error');
      setFeedback('❌ Não foi possível carregar seu perfil.');
      toast('Não foi possível carregar seu perfil.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadProfile();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
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

      const { error: updateError } = await supabase.from('users').update({ name: form.name, phone: form.phone, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (updateError) throw updateError;

      await loadProfile();
      setSaveStatus('success');
      setFeedback('✅ Perfil atualizado com sucesso.');
      toast('Perfil salvo com sucesso!');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { setSaveStatus('idle'); setFeedback(''); }, 3000);
    } catch (error) {
      console.error('saveProfile error:', error);
      setSaveStatus('error');
      setFeedback('❌ Não foi possível salvar. Tente novamente.');
      toast('Erro ao salvar perfil.');
    }
  };

  const initials = form.name?.trim()?.slice(0, 2)?.toUpperCase() || 'CL';

  return (
    <div className="max-w-3xl mx-auto grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Perfil do Cliente</CardTitle>
            <p className="text-text-secondary text-sm">Layout atualizado com componentes shadcn-style.</p>
          </div>
          <Badge>{saveStatus === 'saving' ? 'Salvando' : 'Ativo'}</Badge>
        </CardHeader>
        <CardContent>
          <form id="client-profile-form" className="grid gap-5" onSubmit={onSubmit}>
            <div className="flex items-center gap-3">
              <Avatar><AvatarFallback>{initials}</AvatarFallback></Avatar>
              <div className="text-sm text-text-secondary">Dados básicos do perfil</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="profile-name">Nome</Label>
                <Input id="profile-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="profile-email">E-mail</Label>
                <Input id="profile-email" value={form.email} disabled />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="profile-phone">Telefone</Label>
                <Input id="profile-phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
            </div>

            <Button type="submit" disabled={loading || saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Salvando...' : 'Salvar perfil'}</Button>
            {feedback ? <small className="text-text-secondary">{feedback}</small> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
