import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { getPrivilegedTenantClient, insertAuditLog, requireScopedTenantSession } from '@/lib/server/tenant-access';
import { sanitizeText } from '@/lib/server/tenant-core';

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const rateLimit = await checkRateLimit({
      key: `admin:barbers:update:${getClientIp(req)}`,
      limit: 40,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!rateLimit.allowed) return NextResponse.json({ ok: false, message: 'Muitas requisicoes. Aguarde.' }, { status: 429 });

    const auth = await requireScopedTenantSession(['admin', 'super_admin']);
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

    const tenantId = auth.session.tenantId || auth.session.barbershopId;
    const body = await req.json().catch(() => ({}));
    const patch = {
      name: sanitizeText(body?.name, 120),
      phone: sanitizeText(body?.phone, 40) || null,
      photo_url: sanitizeText(body?.photo_url, 800) || null,
      active: body?.active !== false
    };

    const service = getPrivilegedTenantClient();
    const { data, error } = await service
      .from('barbers')
      .update(patch)
      .eq('id', params.id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();
    if (error) throw error;

    await insertAuditLog({
      userId: auth.session.userId,
      tenantId,
      action: 'barber.updated',
      entity: 'barber',
      entityId: params.id
    });

    return NextResponse.json({ ok: true, row: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'admin_barber_update_failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const auth = await requireScopedTenantSession(['admin', 'super_admin']);
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
    const tenantId = auth.session.tenantId || auth.session.barbershopId;

    const service = getPrivilegedTenantClient();
    const { error } = await service.from('barbers').delete().eq('id', params.id).eq('tenant_id', tenantId);
    if (error) throw error;

    await insertAuditLog({
      userId: auth.session.userId,
      tenantId,
      action: 'barber.deleted',
      entity: 'barber',
      entityId: params.id
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'admin_barber_delete_failed' }, { status: 500 });
  }
}
