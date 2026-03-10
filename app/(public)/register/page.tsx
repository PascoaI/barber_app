'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { withCsrfHeaders } from '@/lib/security/csrf-client';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback('');

    try {
      const response = await fetch('/api/auth/register', withCsrfHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim(),
          password,
          tenant_slug: tenantSlug.trim() || undefined,
          invite_code: inviteCode.trim() || undefined,
          termsAccepted,
          privacyAccepted
        })
      }));

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || 'Nao foi possivel cadastrar.');
      }

      if (result.requiresEmailConfirmation) {
        setFeedback('Cadastro criado. Verifique seu email para confirmar a conta.');
        setLoading(false);
        return;
      }

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
          <p className="text-sm text-text-secondary">Cadastro com registro de consentimento (LGPD).</p>
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
              <small className="text-xs text-text-secondary">Use a senha de sua preferencia para a fase de testes.</small>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="register-invite">Código de convite (opcional)</Label>
              <Input id="register-invite" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="Ex: INVAB12CD" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="register-tenant">Slug da barbearia (opcional)</Label>
              <Input id="register-tenant" value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} placeholder="Ex: barbearia-xz" />
              <small className="text-xs text-text-secondary">Você pode usar código de convite, slug ou cadastro via subdomínio da barbearia.</small>
            </div>

            <label className="flex items-start gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              <span>Li e aceito os <Link href="/terms" className="underline">Termos de Uso</Link>.</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} />
              <span>Li e aceito a <Link href="/privacy" className="underline">Politica de Privacidade</Link>.</span>
            </label>

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
