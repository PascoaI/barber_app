import { NextResponse } from 'next/server';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { getRouteAppSession } from '@/lib/auth/route-session';
import { buildPrivacyExport } from '@/lib/privacy/processor';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const session = await getRouteAppSession();
    if (!session || !['admin', 'super_admin'].includes(session.role)) {
      return NextResponse.json({ ok: false, message: 'Nao autorizado.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.userId || '').trim();
    const barbershopId = String(body?.barbershopId || session.barbershopId || '').trim() || null;
    if (!userId) return NextResponse.json({ ok: false, message: 'userId e obrigatorio.' }, { status: 400 });

    const payload = await buildPrivacyExport({
      userId,
      barbershopId
    });

    const service = createSupabaseServiceClient();
    const { data: exportRow, error: exportError } = await service
      .from('privacy_exports')
      .insert({
        request_id: null,
        user_id: userId,
        barbershop_id: barbershopId,
        payload
      })
      .select('id')
      .single();

    if (exportError) throw exportError;

    await service.from('audit_logs').insert({
      user_id: session.userId,
      barbershop_id: barbershopId,
      action: 'privacy_export_generated',
      entity: 'users',
      entity_id: userId,
      metadata: {
        export_id: exportRow.id
      }
    });

    return NextResponse.json({ ok: true, exportId: exportRow.id, payload });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'privacy_export_failed' }, { status: 500 });
  }
}
