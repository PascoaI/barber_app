import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { getRouteAppSession } from '@/lib/auth/route-session';
import { canAccessTenantScope } from '@/lib/server/tenant-core';

type TenantSession = Awaited<ReturnType<typeof getRouteAppSession>>;

export async function requireTenantSession(allowedRoles?: Array<'super_admin' | 'admin' | 'barber' | 'client'>) {
  const session = await getRouteAppSession();
  if (!session) {
    return {
      ok: false as const,
      status: 401,
      message: 'Nao autenticado.'
    };
  }

  if (allowedRoles?.length && !allowedRoles.includes(session.role)) {
    return {
      ok: false as const,
      status: 403,
      message: 'Permissao insuficiente.'
    };
  }

  return {
    ok: true as const,
    session
  };
}

export async function requireScopedTenantSession(allowedRoles?: Array<'super_admin' | 'admin' | 'barber' | 'client'>) {
  const auth = await requireTenantSession(allowedRoles);
  if (!auth.ok) return auth;
  if (auth.session.role !== 'super_admin' && !auth.session.barbershopId) {
    return {
      ok: false as const,
      status: 403,
      message: 'Tenant do usuario nao encontrado.'
    };
  }
  return auth;
}

export function getPrivilegedTenantClient() {
  return createSupabaseServiceClient();
}

export function canAccessTenant(session: NonNullable<TenantSession>, tenantId: string | null | undefined) {
  return canAccessTenantScope(session, tenantId);
}

export async function insertAuditLog(input: {
  userId?: string | null;
  tenantId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const service = getPrivilegedTenantClient();
  await service.from('audit_logs').insert({
    user_id: input.userId || null,
    tenant_id: input.tenantId || null,
    barbershop_id: input.tenantId || null,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId || null,
    metadata: input.metadata || null
  });
}
