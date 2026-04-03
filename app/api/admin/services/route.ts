import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { getPrivilegedTenantClient, insertAuditLog, requireScopedTenantSession } from '@/lib/server/tenant-access';
import { sanitizeText } from '@/lib/server/tenant-core';

export async function GET() {
  try {
    const auth = await requireScopedTenantSession(['admin', 'super_admin']);
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
    const tenantId = auth.session.tenantId || auth.session.barbershopId;

    const service = getPrivilegedTenantClient();
    const { data, error } = await service
      .from('services')
      .select('id,name,description,duration_minutes,price,active,created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ ok: true, rows: data || [] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'admin_services_failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const rateLimit = await checkRateLimit({
      key: `admin:services:create:${getClientIp(req)}`,
      limit: 30,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!rateLimit.allowed) return NextResponse.json({ ok: false, message: 'Muitas requisicoes. Aguarde.' }, { status: 429 });

    const auth = await requireScopedTenantSession(['admin', 'super_admin']);
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
    const tenantId = auth.session.tenantId || auth.session.barbershopId;
    const body = await req.json().catch(() => ({}));

    const payload = {
      tenant_id: tenantId,
      barbershop_id: tenantId,
      name: sanitizeText(body?.name, 120),
      description: sanitizeText(body?.description, 320) || null,
      duration_minutes: Math.max(5, Number(body?.duration_minutes || 30)),
      price: Math.max(0, Number(body?.price || 0)),
      active: body?.active !== false
    };

    if (!payload.name) {
      return NextResponse.json({ ok: false, message: 'Nome do servico e obrigatorio.' }, { status: 400 });
    }

    const service = getPrivilegedTenantClient();
    const { data, error } = await service.from('services').insert(payload).select('*').single();
    if (error) throw error;

    await insertAuditLog({
      userId: auth.session.userId,
      tenantId,
      action: 'service.created',
      entity: 'service',
      entityId: data?.id || null
    });

    return NextResponse.json({ ok: true, row: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'admin_service_create_failed' }, { status: 500 });
  }
}
