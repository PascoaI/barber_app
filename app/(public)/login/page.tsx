'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error || !data.user) throw new Error(error?.message || 'Falha no login.');

      const [{ data: superAdmin }, { data: profile }] = await Promise.all([
        supabase.from('super_admins').select('id').eq('id', data.user.id).maybeSingle(),
        supabase.from('users').select('role').eq('id', data.user.id).maybeSingle()
      ]);

      if (superAdmin?.id) {
        router.replace('/superadmin/dashboard');
        return;
      }

      const role = String(profile?.role || '').toLowerCase();
      if (role === 'admin') {
        router.replace('/admin/home');
        return;
      }
      if (role === 'barber') {
        router.replace('/barber');
        return;
      }
      router.replace('/client/home');
    } catch (error: any) {
      setFeedback(error?.message || 'Nao foi possivel autenticar.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/75 via-slate-900/70 to-slate-950/80">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <p className="text-sm text-text-secondary">Acesso seguro via Supabase Auth.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="login-pass">Senha</Label>
              <Input id="login-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/register')}>
              Criar conta
            </Button>
            {feedback ? <small className="text-red-300">{feedback}</small> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
