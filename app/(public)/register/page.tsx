'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

const DEFAULT_BARBERSHOP_ID = process.env.NEXT_PUBLIC_DEFAULT_BARBERSHOP_ID || '11111111-1111-1111-1111-111111111111';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) {
        setFeedback('Cadastro criado. Verifique seu email para confirmar a conta.');
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase.from('users').upsert({
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'client',
        barbershop_id: DEFAULT_BARBERSHOP_ID
      });
      if (profileError) throw profileError;

      router.replace('/client/home');
    } catch (err: any) {
      setFeedback(err?.message || 'Nao foi possivel cadastrar.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/75 via-slate-900/70 to-slate-950/80">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <p className="text-sm text-text-secondary">Cadastro de cliente com autenticação segura.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="register-name">Nome</Label>
              <Input id="register-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="register-email">Email</Label>
              <Input id="register-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="register-pass">Senha</Label>
              <Input id="register-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando conta...' : 'Cadastrar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/login')}>
              Voltar para login
            </Button>
            {feedback ? <small className="text-text-secondary">{feedback}</small> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
