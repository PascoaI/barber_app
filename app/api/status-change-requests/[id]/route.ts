import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getOptionalSessionProfile } from '@/lib/server/request-auth';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const ALLOWED_REQUESTED_STATUSES = ['confirmed', 'no_show', 'canceled'] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, error: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.message }, { status: 403 });

    const limit = await checkRateLimit({
      key: `api:status-change-requests:patch:${getClientIp(req)}`,
      limit: 60,
      windowMs: 60 * 1000,
      blockMs: 4 * 60 * 1000
    });
    if (!limit.allowed) return NextResponse.json({ ok: false, error: 'Muitas tentativas. Aguarde alguns instantes.' }, { status: 429 });

    const session = await getOptionalSessionProfile(req);
    if (!session?.id) return NextResponse.json({ ok: false, error: 'Nao autenticado.' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(String(session.role || ''))) {
      return NextResponse.json({ ok: false, error: 'Acesso restrito ao admin.' }, { status: 403 });
    }

    const requestId = String(params?.id || '').trim();
    if (!requestId) return NextResponse.json({ ok: false, error: 'request_id obrigatorio.' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '').trim().toLowerCase();
    const reviewNote = String(body?.review_note || '').trim();
    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ ok: false, error: 'action invalida. Use approved/rejected.' }, { status: 400 });
    }

    const barbershopId = String(session.barbershop_id || session.tenant_id || session.unit_id || '');
    if (!barbershopId) return NextResponse.json({ ok: false, error: 'Sessao sem barbearia associada.' }, { status: 403 });

    const supabase = createSupabaseServerClient();
    const { data: requestRow, error: requestError } = await supabase
      .from('status_change_requests')
      .select('*')
      .eq('id', requestId)
      .eq('barbershop_id', barbershopId)
      .maybeSingle();
    if (requestError) throw requestError;
    if (!requestRow?.id) return NextResponse.json({ ok: false, error: 'Solicitacao nao encontrada.' }, { status: 404 });
    if (String(requestRow.status || '') !== 'pending') {
      return NextResponse.json({ ok: false, error: 'Solicitacao ja analisada.' }, { status: 409 });
    }

    const nowIso = new Date().toISOString();
    const requestedStatus = String(requestRow.requested_status || '').toLowerCase();
    if (!ALLOWED_REQUESTED_STATUSES.includes(requestedStatus as any)) {
      return NextResponse.json({ ok: false, error: 'requested_status da solicitacao e invalido.' }, { status: 400 });
    }

    if (action === 'approved') {
      const patch: Record<string, any> = {
        status: requestedStatus,
        updated_at: nowIso,
        updated_by: String(session.email || session.id || 'admin'),
        status_reason: String(requestRow.reason || '').trim() || null
      };
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update(patch)
        .eq('id', String(requestRow.appointment_id))
        .eq('barbershop_id', barbershopId);
      if (appointmentError) throw appointmentError;
    }

    const { data: updated, error: updateError } = await supabase
      .from('status_change_requests')
      .update({
        status: action,
        reviewed_by_user_id: String(session.id),
        reviewed_by_name: String(session.email || 'admin'),
        reviewed_at: nowIso,
        review_note: reviewNote || null,
        updated_at: nowIso
      })
      .eq('id', requestId)
      .eq('barbershop_id', barbershopId)
      .select('*')
      .single();
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, request: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'status_change_requests_patch_failed' }, { status: 500 });
  }
}
