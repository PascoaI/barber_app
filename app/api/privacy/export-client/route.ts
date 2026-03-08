import { NextResponse } from 'next/server';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { getRouteAppSession } from '@/lib/auth/route-session';
import { buildPrivacyExport } from '@/lib/privacy/processor';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

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

    const limit = await checkRateLimit({
      key: `api:privacy:export:${getClientIp(req)}:${session.role}`,
      limit: 15,
      windowMs: 60 * 1000,
      blockMs: 10 * 60 * 1000
    });
    if (!limit.allowed) {
      return NextResponse.json({ ok: false, message: 'Muitas requisicoes. Aguarde.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.userId || '').trim();
    if (!userId) return NextResponse.json({ ok: false, message: 'userId e obrigatorio.' }, { status: 400 });

    const requestedBarbershopId = String(body?.barbershopId || '').trim() || null;
    let barbershopId: string | null = null;
    if (session.role === 'super_admin') {
      barbershopId = requestedBarbershopId;
    } else {
      if (!session.barbershopId) {
        return NextResponse.json({ ok: false, message: 'Sessao admin sem barbearia vinculada.' }, { status: 403 });
      }
      if (requestedBarbershopId && requestedBarbershopId !== session.barbershopId) {
        return NextResponse.json({ ok: false, message: 'Escopo de barbearia invalido.' }, { status: 403 });
      }
      barbershopId = session.barbershopId;
    }

    const service = createSupabaseServiceClient();
    if (session.role === 'admin') {
      const { data: targetUser, error: targetError } = await service
        .from('users')
        .select('id,barbershop_id')
        .eq('id', userId)
        .maybeSingle();
      if (targetError) throw targetError;
      if (!targetUser?.id || String(targetUser.barbershop_id || '') !== String(barbershopId || '')) {
        return NextResponse.json({ ok: false, message: 'Usuario fora do escopo da barbearia.' }, { status: 403 });
      }
    }

    const payload = await buildPrivacyExport({
      userId,
      barbershopId
    });

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
