'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isSuperAdminSession, signInSuperAdmin } from '@/services/superadmin';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('super@barber.com');
  const [password, setPassword] = useState('123456');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      if (await isSuperAdminSession()) router.replace('/superadmin/dashboard');
    })();
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback('');
    const result = await signInSuperAdmin(email.trim(), password);
    if (!result.ok) {
      setFeedback(result.message);
      setLoading(false);
      return;
    }
    router.replace('/superadmin/dashboard');
  };

  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/75 via-slate-900/70 to-slate-950/80">
        <CardHeader>
          <CardTitle>Acesso SuperAdmin</CardTitle>
          <p className="text-sm text-text-secondary">Acesso exclusivo do administrador da plataforma.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="super-email">Email</Label>
              <Input id="super-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="super-pass">Senha</Label>
              <Input id="super-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar no painel'}</Button>
            <small className="text-text-secondary">Demo SuperAdmin: super@barber.com / 123456</small>
            {feedback ? <small className="text-red-300">{feedback}</small> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
