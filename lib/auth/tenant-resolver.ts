type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => any;
  };
};

type TenantResolutionInput = {
  req: Request;
  body: Record<string, unknown>;
  service: SupabaseLike;
};

type TenantResolutionResult =
  | { ok: true; barbershopId: string; source: 'invite_code' | 'slug' | 'subdomain' }
  | { ok: false; reason: string; message: string };

function normalizeSlug(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeInviteCode(value: unknown) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function extractSubdomain(req: Request) {
  const forwardedHost = req.headers.get('x-forwarded-host') || '';
  const host = req.headers.get('host') || '';
  const rawHost = (forwardedHost || host).trim().toLowerCase();
  if (!rawHost) return '';

  const cleanHost = rawHost.split(':')[0];
  const configuredBase = String(process.env.APP_BASE_DOMAIN || '').trim().toLowerCase();

  if (configuredBase && cleanHost.endsWith(`.${configuredBase}`)) {
    return normalizeSlug(cleanHost.slice(0, -(configuredBase.length + 1)));
  }

  if (cleanHost.endsWith('.localhost')) {
    return normalizeSlug(cleanHost.split('.')[0] || '');
  }

  const parts = cleanHost.split('.');
  if (parts.length >= 3) {
    return normalizeSlug(parts[0] || '');
  }

  return '';
}

async function findByInviteCode(service: SupabaseLike, inviteCode: string) {
  const { data, error } = await service
    .from('barbershops')
    .select('id,status')
    .eq('invite_code', inviteCode)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function findBySlug(service: SupabaseLike, slug: string) {
  const { data, error } = await service
    .from('barbershops')
    .select('id,status')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function isTenantInactive(status: unknown) {
  const value = String(status || '').toLowerCase();
  return ['suspended', 'disabled'].includes(value);
}

export async function resolveTenantForRegistration(input: TenantResolutionInput): Promise<TenantResolutionResult> {
  const inviteCode = normalizeInviteCode(input.body?.invite_code || input.body?.inviteCode);
  if (inviteCode) {
    const row = await findByInviteCode(input.service, inviteCode);
    if (!row?.id) {
      return { ok: false, reason: 'invite_not_found', message: 'Código de convite inválido.' };
    }
    if (isTenantInactive((row as any).status)) {
      return { ok: false, reason: 'tenant_inactive', message: 'Esta barbearia está sem acesso para novos cadastros.' };
    }
    return { ok: true, barbershopId: String((row as any).id), source: 'invite_code' };
  }

  const explicitSlug = normalizeSlug(
    input.body?.tenant_slug || input.body?.barbershop_slug || input.body?.slug
  );
  if (explicitSlug) {
    const row = await findBySlug(input.service, explicitSlug);
    if (!row?.id) {
      return { ok: false, reason: 'slug_not_found', message: 'Slug da barbearia não encontrado.' };
    }
    if (isTenantInactive((row as any).status)) {
      return { ok: false, reason: 'tenant_inactive', message: 'Esta barbearia está sem acesso para novos cadastros.' };
    }
    return { ok: true, barbershopId: String((row as any).id), source: 'slug' };
  }

  const subdomain = extractSubdomain(input.req);
  if (subdomain) {
    const row = await findBySlug(input.service, subdomain);
    if (!row?.id) {
      return { ok: false, reason: 'subdomain_not_found', message: 'Subdomínio não reconhecido para cadastro.' };
    }
    if (isTenantInactive((row as any).status)) {
      return { ok: false, reason: 'tenant_inactive', message: 'Esta barbearia está sem acesso para novos cadastros.' };
    }
    return { ok: true, barbershopId: String((row as any).id), source: 'subdomain' };
  }

  const fallbackSlug = normalizeSlug(process.env.DEFAULT_TENANT_SLUG || process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG);
  if (fallbackSlug) {
    const row = await findBySlug(input.service, fallbackSlug);
    if (row?.id && !isTenantInactive((row as any).status)) {
      return { ok: true, barbershopId: String((row as any).id), source: 'slug' };
    }
  }

  return {
    ok: false,
    reason: 'missing_tenant_context',
    message: 'Contexto de tenant ausente. Use slug, subdomínio ou código de convite.'
  };
}
