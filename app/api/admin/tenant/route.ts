import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { canAccessTenant, getPrivilegedTenantClient, insertAuditLog, requireScopedTenantSession } from '@/lib/server/tenant-access';
import { sanitizeText } from '@/lib/server/tenant-core';

const DEFAULT_HOURS = {
  monday: { enabled: true, open: '09:00', close: '19:00' },
  tuesday: { enabled: true, open: '09:00', close: '19:00' },
  wednesday: { enabled: true, open: '09:00', close: '19:00' },
  thursday: { enabled: true, open: '09:00', close: '19:00' },
  friday: { enabled: true, open: '09:00', close: '19:00' },
  saturday: { enabled: true, open: '09:00', close: '17:00' },
  sunday: { enabled: false, open: '09:00', close: '13:00' }
};

export async function GET() {
  try {
    const auth = await requireScopedTenantSession(['admin', 'super_admin']);
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

    const tenantId = auth.session.tenantId || auth.session.barbershopId;
    const service = getPrivilegedTenantClient();
    const [{ data: tenant }, { data: settings }, { data: barbers }, { data: services }, { data: appointments }] = await Promise.all([
      service.from('tenants').select('*').eq('id', tenantId).maybeSingle(),
      service.from('tenant_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
      service.from('barbers').select('id,name,active,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      service.from('services').select('id,name,price,active,created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      service.from('appointments').select('id,status,appointment_date,service_id').eq('tenant_id', tenantId).order('appointment_date', { ascending: false }).limit(200)
    ]);

    return NextResponse.json({
      ok: true,
      tenant,
      settings: settings || {
        tenant_id: tenantId,
        barbershop_name: tenant?.name || '',
        logo_url: null,
        branding_primary: '#c69a45',
        branding_secondary: '#0f172a',
        business_hours: DEFAULT_HOURS
      },
      stats: {
        team_count: barbers?.length || 0,
        services_count: services?.length || 0,
        appointments_count: appointments?.length || 0,
        estimated_revenue: (appointments || [])
          .filter((item: any) => ['scheduled', 'completed'].includes(String(item.status || '')))
          .length * 45
      }
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'admin_tenant_failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const rateLimit = await checkRateLimit({
      key: `admin:tenant:update:${getClientIp(req)}`,
      limit: 20,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!rateLimit.allowed) return NextResponse.json({ ok: false, message: 'Muitas requisicoes. Aguarde.' }, { status: 429 });

    const auth = await requireScopedTenantSession(['admin', 'super_admin']);
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

    const body = await req.json().catch(() => ({}));
    const tenantId = String(body?.tenant_id || auth.session.tenantId || auth.session.barbershopId || '');
    if (!tenantId || !canAccessTenant(auth.session, tenantId)) {
      return NextResponse.json({ ok: false, message: 'Tenant invalido.' }, { status: 403 });
    }

    const payload = {
      tenant_id: tenantId,
      barbershop_name: sanitizeText(body?.barbershop_name, 120),
      logo_url: sanitizeText(body?.logo_url, 800) || null,
      branding_primary: sanitizeText(body?.branding_primary, 20) || '#c69a45',
      branding_secondary: sanitizeText(body?.branding_secondary, 20) || '#0f172a',
      business_hours: body?.business_hours && typeof body.business_hours === 'object' ? body.business_hours : DEFAULT_HOURS
    };
    if (!payload.barbershop_name) {
      return NextResponse.json({ ok: false, message: 'Nome da barbearia e obrigatorio.' }, { status: 400 });
    }

    const service = getPrivilegedTenantClient();
    const { error: tenantSettingsError } = await service.from('tenant_settings').upsert(payload);
    if (tenantSettingsError) throw tenantSettingsError;

    await Promise.all([
      service.from('tenants').update({ name: payload.barbershop_name }).eq('id', tenantId),
      service.from('barbershops').update({ name: payload.barbershop_name }).eq('id', tenantId)
    ]);

    await insertAuditLog({
      userId: auth.session.userId,
      tenantId,
      action: 'tenant.settings.updated',
      entity: 'tenant_settings',
      entityId: tenantId
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'admin_tenant_update_failed' }, { status: 500 });
  }
}
