import { NextResponse } from 'next/server';
import { assertSuperAdminSession, getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import type { TenantOnboardingRequest } from '@/types/tenant';

export async function GET() {
  try {
    const auth = await assertSuperAdminSession();
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const service = getServiceClientForPrivilegedOps();
    const { data, error } = await service
      .from('tenant_onboarding_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      rows: (data || []) as TenantOnboardingRequest[]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'superadmin_onboarding_requests_failed' }, { status: 500 });
  }
}
