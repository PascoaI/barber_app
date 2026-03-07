'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { withCsrfHeaders } from '@/lib/security/csrf-client';

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
      const response = await fetch('/api/auth/login', withCsrfHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      }));

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || 'Nao foi possivel autenticar.');
      }

      router.replace(result.redirectPath || '/client/home');
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
          <p className="text-sm text-text-secondary">Autenticacao protegida com rate limit, lockout e verificacao CSRF.</p>
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
            <p className="text-xs text-text-secondary">
              Ao continuar, voce concorda com os{' '}
              <Link href="/terms" className="underline">Termos de Uso</Link>{' '}
              e com a{' '}
              <Link href="/privacy" className="underline">Politica de Privacidade</Link>.
            </p>
            {feedback ? <small className="text-red-300">{feedback}</small> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
