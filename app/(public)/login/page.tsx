'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { withCsrfHeaders } from '@/lib/security/csrf-client';

type LoginHint = {
  email: string;
  role: 'admin' | 'barber' | 'client' | string;
};

function roleLabel(role: string) {
  if (role === 'admin') return 'Admin';
  if (role === 'barber') return 'Barbeiro';
  if (role === 'client') return 'Cliente';
  return role || 'Usuario';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [hints, setHints] = useState<LoginHint[]>([]);

  useEffect(() => {
    let active = true;
    const loadHints = async () => {
      try {
        const response = await fetch('/api/auth/login-hints', { cache: 'no-store' });
        const result = await response.json().catch(() => ({}));
        if (!active || !response.ok || !result?.ok) return;
        setHints(Array.isArray(result.hints) ? result.hints : []);
      } catch {
        // Keep login resilient even when hints are unavailable.
      }
    };
    loadHints();
    return () => {
      active = false;
    };
  }, []);

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
            {hints.length ? (
              <div className="rounded-lg border border-borderc/80 bg-slate-950/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Dicas de login (exceto SuperAdmin)</p>
                <ul className="mt-2 grid gap-1.5 text-xs text-text-secondary">
                  {hints.map((item) => (
                    <li key={item.email} className="flex items-center justify-between gap-2 rounded-md border border-borderc/70 bg-slate-900/40 px-2 py-1.5">
                      <span className="truncate">{item.email}</span>
                      <span className="shrink-0 rounded-full border border-borderc/80 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        {roleLabel(item.role)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {feedback ? <small className="text-red-300">{feedback}</small> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
