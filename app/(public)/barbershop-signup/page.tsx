'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { withCsrfHeaders } from '@/lib/security/csrf-client';

const WHATSAPP_FALLBACK_URL = 'https://wa.me/';

export default function BarbershopSignupPage() {
  const [form, setForm] = useState({
    barbershop_name: '',
    owner_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    barbers_count: '',
    requested_slug: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('');

    try {
      const response = await fetch('/api/public/onboarding-requests', withCsrfHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          barbers_count: form.barbers_count ? Number(form.barbers_count) : null
        })
      }));

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || 'Nao foi possivel enviar sua solicitacao.');
      }

      setSubmitted(true);
      setFeedback(result?.message || 'Sua solicitacao foi enviada para analise.');
    } catch (error: any) {
      setFeedback(error?.message || 'Nao foi possivel enviar sua solicitacao.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 md:grid-cols-[1.05fr_0.95fr]">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-slate-950/90">
        <CardHeader>
          <CardTitle>Leve sua barbearia para o SaaS</CardTitle>
          <p className="text-sm text-text-secondary">
            Cadastre sua operacao para analise. O tenant so sera criado apos aprovacao do superadmin.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          {submitted ? (
            <div className="grid gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <div className="grid gap-1">
                <strong className="text-lg">Sua solicitacao foi enviada para analise</strong>
                <p className="text-sm text-text-secondary">
                  O tenant ainda nao foi ativado. Assim que houver aprovacao, o acesso admin sera liberado.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={WHATSAPP_FALLBACK_URL} target="_blank" rel="noreferrer">
                    Entrar em contato via WhatsApp
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/login">Voltar para login</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="shop-name">Nome da barbearia</Label>
                <Input id="shop-name" value={form.barbershop_name} onChange={(e) => setForm((current) => ({ ...current, barbershop_name: e.target.value }))} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="owner-name">Nome do responsavel</Label>
                <Input id="owner-name" value={form.owner_name} onChange={(e) => setForm((current) => ({ ...current, owner_name: e.target.value }))} required />
              </div>
              <div className="grid gap-1.5 md:grid-cols-2 md:gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="owner-email">Email</Label>
                  <Input id="owner-email" type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="owner-phone">Telefone</Label>
                  <Input id="owner-phone" value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} required />
                </div>
              </div>
              <div className="grid gap-1.5 md:grid-cols-2 md:gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" value={form.state} onChange={(e) => setForm((current) => ({ ...current, state: e.target.value }))} required />
                </div>
              </div>
              <div className="grid gap-1.5 md:grid-cols-2 md:gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="barbers-count">Quantidade de barbeiros</Label>
                  <Input id="barbers-count" type="number" min="0" value={form.barbers_count} onChange={(e) => setForm((current) => ({ ...current, barbers_count: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="slug">Slug desejado</Label>
                  <Input id="slug" value={form.requested_slug} onChange={(e) => setForm((current) => ({ ...current, requested_slug: e.target.value }))} placeholder="minha-barbearia" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Observacoes</Label>
                <textarea
                  id="notes"
                  className="min-h-28 rounded-xl border border-borderc bg-slate-950/70 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.notes}
                  onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar solicitacao'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/login">Ja tenho acesso</Link>
                </Button>
              </div>
            </form>
          )}
          {feedback ? <small className="text-text-secondary">{feedback}</small> : null}
        </CardContent>
      </Card>

      <Card className="border-borderc/80 bg-slate-950/65">
        <CardHeader>
          <CardTitle>O que acontece depois</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-text-secondary">
          <div className="rounded-2xl border border-borderc bg-slate-950/40 p-4">
            <strong className="block text-text-primary">1. Analise da operacao</strong>
            Validamos os dados e mantemos a solicitacao com status <code>pending</code>.
          </div>
          <div className="rounded-2xl border border-borderc bg-slate-950/40 p-4">
            <strong className="block text-text-primary">2. Aprovacao manual</strong>
            O superadmin cria o tenant, o admin inicial e ativa o slug da barbearia.
          </div>
          <div className="rounded-2xl border border-borderc bg-slate-950/40 p-4">
            <strong className="block text-text-primary">3. Autogestao</strong>
            Depois da aprovacao, sua barbearia passa a gerenciar equipe, servicos, agenda e relatorios.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
