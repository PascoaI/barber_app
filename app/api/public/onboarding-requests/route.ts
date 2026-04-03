import { NextResponse } from 'next/server';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import {
  ensureTenantSlug,
  isReservedTenantSlug,
  sanitizeMultilineText,
  sanitizeText
} from '@/lib/server/tenant-core';

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const rateLimit = await checkRateLimit({
      key: `public:onboarding-request:${getClientIp(req)}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      blockMs: 15 * 60 * 1000
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ ok: false, message: 'Muitas solicitacoes enviadas. Tente novamente em alguns minutos.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const payload = {
      barbershop_name: sanitizeText(body?.barbershop_name, 120),
      owner_name: sanitizeText(body?.owner_name, 120),
      email: sanitizeText(body?.email, 160).toLowerCase(),
      phone: sanitizeText(body?.phone, 40),
      city: sanitizeText(body?.city, 80),
      state: sanitizeText(body?.state, 40),
      barbers_count: body?.barbers_count ? Number(body.barbers_count) : null,
      notes: sanitizeMultilineText(body?.notes, 1200) || null,
      requested_slug: sanitizeText(body?.requested_slug, 80)
    };

    if (!payload.barbershop_name || !payload.owner_name || !payload.email || !payload.phone || !payload.city || !payload.state) {
      return NextResponse.json({ ok: false, message: 'Preencha nome da barbearia, responsavel, email, telefone, cidade e estado.' }, { status: 400 });
    }

    if (!String(payload.email).includes('@')) {
      return NextResponse.json({ ok: false, message: 'Informe um email valido.' }, { status: 400 });
    }

    if (payload.barbers_count !== null && (!Number.isFinite(payload.barbers_count) || payload.barbers_count < 0 || payload.barbers_count > 500)) {
      return NextResponse.json({ ok: false, message: 'Quantidade de barbeiros invalida.' }, { status: 400 });
    }

    const preferredSlug = payload.requested_slug ? ensureTenantSlug(payload.requested_slug, payload.barbershop_name) : ensureTenantSlug(payload.barbershop_name);
    if (isReservedTenantSlug(preferredSlug)) {
      return NextResponse.json({ ok: false, message: 'Escolha outro slug para a barbearia.' }, { status: 400 });
    }

    const service = createSupabaseServiceClient();
    const { data: duplicatePending } = await service
      .from('tenant_onboarding_requests')
      .select('id')
      .eq('email', payload.email)
      .eq('status', 'pending')
      .maybeSingle();

    if (duplicatePending?.id) {
      return NextResponse.json({ ok: false, message: 'Ja existe uma solicitacao pendente com este email.' }, { status: 409 });
    }

    const [{ data: slugInTenants }, { data: slugInBarbershops }] = await Promise.all([
      service.from('tenants').select('id').eq('slug', preferredSlug).maybeSingle(),
      service.from('barbershops').select('id').eq('slug', preferredSlug).maybeSingle()
    ]);

    if (slugInTenants?.id || slugInBarbershops?.id) {
      return NextResponse.json({ ok: false, message: 'O slug sugerido ja esta em uso. Ajuste e tente novamente.' }, { status: 409 });
    }

    const { error } = await service.from('tenant_onboarding_requests').insert({
      ...payload,
      requested_slug: preferredSlug,
      status: 'pending'
    });
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: 'Sua solicitacao foi enviada para analise.',
      requested_slug: preferredSlug
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'onboarding_request_failed' }, { status: 500 });
  }
}
