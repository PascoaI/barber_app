import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPathTenantSlug } from '@/lib/server/tenant-core';

const enableLegacySlugRedirects = process.env.ENABLE_LEGACY_SLUG_REDIRECTS === 'true';

const LEGACY_REDIRECTS: Record<string, string> = {
  login: '/login',
  register: '/register',
  booking: '/booking',
  'booking-service': '/booking/service',
  'booking-professional': '/booking/professional',
  'booking-datetime': '/booking/datetime',
  'booking-location': '/booking/location',
  'booking-review': '/booking/review',
  'client-home': '/client/home',
  'client-history': '/client/history',
  'client-profile': '/client/profile',
  'client-subscriptions': '/client/subscriptions',
  'client-loyalty': '/client/loyalty',
  'client-notifications': '/client/notifications',
  'barber-home': '/barber',
  'admin-home': '/admin/home',
  'admin-barbers': '/admin/barbers',
  'admin-finance': '/admin/finance',
  'admin-settings': '/admin/settings',
  'admin-stock': '/admin/stock',
  'admin-subscriptions': '/admin/subscriptions',
  'admin-blocked-slots': '/admin/blocked-slots',
  'super-admin-login': '/superadmin/login',
  'super-admin-tenants': '/superadmin/barbershops',
  'super-admin-barbershop-form': '/superadmin/barbershops/new'
};

export function generateStaticParams() {
  if (!enableLegacySlugRedirects) return [];
  return Object.keys(LEGACY_REDIRECTS).map((slug) => ({ slug }));
}

export default async function GenericTenantRoute({ params }: { params: { slug: string } }) {
  if (enableLegacySlugRedirects && LEGACY_REDIRECTS[params.slug]) {
    redirect(LEGACY_REDIRECTS[params.slug]);
  }

  const slug = getPathTenantSlug(`/${params.slug}`);
  if (!slug) notFound();

  const service = createSupabaseServiceClient();
  const { data: tenant } = await service.from('tenants').select('*').eq('slug', slug).maybeSingle();

  if (!tenant?.id) notFound();
  const { data: settings } = await service.from('tenant_settings').select('*').eq('tenant_id', tenant.id).maybeSingle();
  if (tenant.status !== 'active') {
    return (
      <div className="mx-auto grid w-full max-w-2xl gap-4">
        <Card className="border-borderc/80 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Tenant indisponivel</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-text-secondary">
              A barbearia <strong>{tenant.name}</strong> esta temporariamente inativa.
            </p>
            <Button asChild>
              <Link href="/login">Ir para login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 md:grid-cols-[1.15fr_0.85fr]">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/85">
        <CardHeader>
          <CardTitle>{settings?.barbershop_name || tenant.name}</CardTitle>
          <p className="text-sm text-text-secondary">
            Tenant resolvido por slug. Esta superficie ja esta pronta para `tenant.slug.sistema.com` ou para a rota dinamica `/{tenant.slug}`.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
            <small className="text-text-secondary">Slug</small>
            <p className="text-lg font-semibold">{tenant.slug}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/booking">Agendar horario</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/register?tenant=${tenant.slug}`}>Criar conta neste tenant</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-borderc/80 bg-slate-950/70">
        <CardHeader>
          <CardTitle>Painel do tenant</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-text-secondary">
          <div className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
            <strong className="block text-text-primary">Isolamento multi-tenant</strong>
            Todas as APIs administrativas e operacionais passam a validar o tenant associado ao usuario.
          </div>
          <div className="rounded-2xl border border-borderc bg-slate-950/35 p-4">
            <strong className="block text-text-primary">Autossuporte</strong>
            Configuracoes, equipe, servicos e relatorios ja podem ser geridos pelo admin da barbearia.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
