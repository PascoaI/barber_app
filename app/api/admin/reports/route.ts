import { NextResponse } from 'next/server';
import { getPrivilegedTenantClient, requireScopedTenantSession } from '@/lib/server/tenant-access';

export async function GET() {
  try {
    const auth = await requireScopedTenantSession(['admin', 'super_admin']);
    if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
    const tenantId = auth.session.tenantId || auth.session.barbershopId;

    const service = getPrivilegedTenantClient();
    const [{ data: appointments }, { data: services }] = await Promise.all([
      service
        .from('appointments')
        .select('id,status,appointment_date,service_id')
        .eq('tenant_id', tenantId)
        .order('appointment_date', { ascending: false })
        .limit(500),
      service.from('services').select('id,name,price').eq('tenant_id', tenantId)
    ]);

    const serviceMap = new Map((services || []).map((item: any) => [item.id, item]));
    const byService = new Map<string, number>();
    let estimatedRevenue = 0;

    for (const row of appointments || []) {
      const serviceRow = serviceMap.get((row as any).service_id);
      const serviceName = serviceRow?.name || 'Servico nao identificado';
      byService.set(serviceName, (byService.get(serviceName) || 0) + 1);
      if (['scheduled', 'completed'].includes(String((row as any).status || ''))) {
        estimatedRevenue += Number(serviceRow?.price || 45);
      }
    }

    return NextResponse.json({
      ok: true,
      rows: appointments || [],
      estimatedRevenue,
      topServices: Array.from(byService.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'admin_reports_failed' }, { status: 500 });
  }
}
