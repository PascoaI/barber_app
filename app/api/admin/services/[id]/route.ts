import { NextResponse } from 'next/server';
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

    const auth = await requireScopedTenantSession(['admin', 'super_admin']);
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
    const tenantId = auth.session.tenantId || auth.session.barbershopId;
    const body = await req.json().catch(() => ({}));

    const patch = {
      name: sanitizeText(body?.name, 120),
      description: sanitizeText(body?.description, 320) || null,
      duration_minutes: Math.max(5, Number(body?.duration_minutes || 30)),
      price: Math.max(0, Number(body?.price || 0)),
      active: body?.active !== false
    };

    const service = getPrivilegedTenantClient();
    const { data, error } = await service
      .from('services')
      .update(patch)
      .eq('id', params.id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();
    if (error) throw error;

    await insertAuditLog({
      userId: auth.session.userId,
      tenantId,
      action: 'service.updated',
      entity: 'service',
      entityId: params.id
    });

    return NextResponse.json({ ok: true, row: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'admin_service_update_failed' }, { status: 500 });
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
    const { error } = await service.from('services').delete().eq('id', params.id).eq('tenant_id', tenantId);
    if (error) throw error;

    await insertAuditLog({
      userId: auth.session.userId,
      tenantId,
      action: 'service.deleted',
      entity: 'service',
      entityId: params.id
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'admin_service_delete_failed' }, { status: 500 });
  }
}
