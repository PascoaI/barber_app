import { NextResponse } from 'next/server';
import { assertSuperAdminSession, getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { insertAuditLog } from '@/lib/server/tenant-access';
import {
  ensureTenantSlug,
  mapBarbershopStatusToTenantStatus,
  mapTenantStatusToBarbershopStatus,
  sanitizeText
} from '@/lib/server/tenant-core';

type Params = { params: { id: string } };

async function ensureUniqueSlug(service: ReturnType<typeof getServiceClientForPrivilegedOps>, baseSlug: string) {
  const seed = ensureTenantSlug(baseSlug);
  for (let index = 0; index < 25; index += 1) {
    const candidate = index === 0 ? seed : `${seed}-${index + 1}`;
    const [{ data: tenant }, { data: barbershop }] = await Promise.all([
      service.from('tenants').select('id').eq('slug', candidate).maybeSingle(),
      service.from('barbershops').select('id').eq('slug', candidate).maybeSingle()
    ]);
    if (!tenant?.id && !barbershop?.id) return candidate;
  }
  throw new Error('Nao foi possivel gerar um slug unico para o tenant.');
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const rateLimit = await checkRateLimit({
      key: `superadmin:onboarding-request:${getClientIp(req)}`,
      limit: 20,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ ok: false, message: 'Muitas requisicoes. Aguarde um pouco.' }, { status: 429 });
    }

    const auth = await assertSuperAdminSession();
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

    const body = await req.json().catch(() => ({}));
    const decision = sanitizeText(body?.decision, 20).toLowerCase();
    const requestedPassword = sanitizeText(body?.password, 120) || 'BarberPro@123';
    const rejectionReason = sanitizeText(body?.rejection_reason, 200) || null;

    if (!['approve', 'reject'].includes(decision)) {
      return NextResponse.json({ ok: false, message: 'Decisao invalida.' }, { status: 400 });
    }

    const service = getServiceClientForPrivilegedOps();
    const { data: requestRow, error: requestError } = await service
      .from('tenant_onboarding_requests')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (requestError) throw requestError;
    if (!requestRow) return NextResponse.json({ ok: false, message: 'Solicitacao nao encontrada.' }, { status: 404 });
    if (requestRow.status !== 'pending') {
      return NextResponse.json({ ok: false, message: 'Esta solicitacao ja foi processada.' }, { status: 409 });
    }

    if (decision === 'reject') {
      const { error: updateError } = await service
        .from('tenant_onboarding_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: auth.user.id,
          rejection_reason: rejectionReason
        })
        .eq('id', params.id);
      if (updateError) throw updateError;

      await insertAuditLog({
        userId: auth.user.id,
        action: 'tenant_request.rejected',
        entity: 'tenant_onboarding_request',
        entityId: params.id,
        metadata: { email: requestRow.email }
      });

      return NextResponse.json({ ok: true, status: 'rejected' });
    }

    const slug = await ensureUniqueSlug(service, requestRow.requested_slug || requestRow.barbershop_name);
    const tenantStatus = 'active';
    const barbershopStatus = mapTenantStatusToBarbershopStatus(tenantStatus, 'active');

    const { data: createdBarbershop, error: barbershopError } = await service
      .from('barbershops')
      .insert({
        name: requestRow.barbershop_name,
        owner_name: requestRow.owner_name,
        email: requestRow.email,
        phone: requestRow.phone,
        address: `${requestRow.city}/${requestRow.state}`,
        slug,
        status: barbershopStatus,
        plan: 'basic'
      })
      .select('id,name,slug,status,created_at')
      .single();
    if (barbershopError || !createdBarbershop?.id) {
      return NextResponse.json({ ok: false, message: barbershopError?.message || 'Falha ao criar barbearia.' }, { status: 400 });
    }

    const { error: tenantError } = await service.from('tenants').upsert({
      id: createdBarbershop.id,
      name: createdBarbershop.name,
      slug,
      status: tenantStatus
    });
    if (tenantError) {
      await service.from('barbershops').delete().eq('id', createdBarbershop.id);
      return NextResponse.json({ ok: false, message: tenantError.message || 'Falha ao criar tenant.' }, { status: 400 });
    }

    await service.from('tenant_settings').upsert({
      tenant_id: createdBarbershop.id,
      barbershop_name: requestRow.barbershop_name
    });

    const { data: authUser, error: authUserError } = await service.auth.admin.createUser({
      email: requestRow.email,
      password: requestedPassword,
      email_confirm: true,
      user_metadata: {
        name: requestRow.owner_name,
        tenant_id: createdBarbershop.id
      }
    });

    if (authUserError || !authUser.user?.id) {
      await service.from('tenants').delete().eq('id', createdBarbershop.id);
      await service.from('barbershops').delete().eq('id', createdBarbershop.id);
      return NextResponse.json({ ok: false, message: authUserError?.message || 'Falha ao criar admin do tenant.' }, { status: 400 });
    }

    const { error: profileError } = await service.from('users').upsert({
      id: authUser.user.id,
      tenant_id: createdBarbershop.id,
      barbershop_id: createdBarbershop.id,
      name: requestRow.owner_name,
      email: requestRow.email,
      role: 'admin'
    });

    if (profileError) {
      await service.auth.admin.deleteUser(authUser.user.id);
      await service.from('tenants').delete().eq('id', createdBarbershop.id);
      await service.from('barbershops').delete().eq('id', createdBarbershop.id);
      return NextResponse.json({ ok: false, message: profileError.message || 'Falha ao vincular admin ao tenant.' }, { status: 400 });
    }

    const { error: requestUpdateError } = await service
      .from('tenant_onboarding_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: auth.user.id,
        tenant_id: createdBarbershop.id,
        created_admin_user_id: authUser.user.id
      })
      .eq('id', params.id);
    if (requestUpdateError) throw requestUpdateError;

    await insertAuditLog({
      userId: auth.user.id,
      tenantId: createdBarbershop.id,
      action: 'tenant_request.approved',
      entity: 'tenant_onboarding_request',
      entityId: params.id,
      metadata: {
        onboarding_email: requestRow.email,
        tenant_slug: slug,
        tenant_status: mapBarbershopStatusToTenantStatus(createdBarbershop.status)
      }
    });

    return NextResponse.json({
      ok: true,
      status: 'approved',
      tenant: {
        id: createdBarbershop.id,
        slug
      }
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'superadmin_onboarding_request_decision_failed' }, { status: 500 });
  }
}
