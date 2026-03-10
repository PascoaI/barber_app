import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getOptionalSessionProfile } from '@/lib/server/request-auth';
import { canTransitionStatus } from '@/lib/appointments-policy';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ error: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

    const limit = await checkRateLimit({
      key: `api:appointments:confirm-service:${getClientIp(req)}`,
      limit: 60,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde e tente novamente.' }, { status: 429 });
    }

    const session = await getOptionalSessionProfile(req);
    if (!session?.id) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
    if (!['admin', 'barber', 'super_admin'].includes(String(session.role || ''))) {
      return NextResponse.json({ error: 'Acesso restrito ao admin/barbeiro.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const appointmentId = String(body?.appointment_id || '').trim();
    if (!appointmentId) return NextResponse.json({ error: 'appointment_id obrigatorio.' }, { status: 400 });

    const barbershopId = String(session.barbershop_id || session.tenant_id || session.unit_id || '');
    if (!barbershopId) return NextResponse.json({ error: 'Sessao sem barbearia associada.' }, { status: 403 });

    const supabase = createSupabaseServerClient();
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id,barbershop_id,status,start_datetime,check_in_time,check_in_by')
      .eq('id', appointmentId)
      .eq('barbershop_id', barbershopId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!appointment?.id) return NextResponse.json({ error: 'Agendamento nao encontrado.' }, { status: 404 });

    if (String(appointment.status || '') === 'completed') {
      return NextResponse.json({ ok: true, already_completed: true, appointment });
    }

    if (!['pending', 'confirmed'].includes(String(appointment.status || ''))) {
      return NextResponse.json({ error: 'Somente pendentes ou confirmados podem ser concluidos manualmente.', reason: 'invalid_status' }, { status: 409 });
    }

    if (!canTransitionStatus(String(appointment.status), 'completed')) {
      return NextResponse.json({ error: 'Transicao de status invalida.', reason: 'invalid_transition' }, { status: 409 });
    }

    const now = new Date();
    if (new Date(String(appointment.start_datetime)).getTime() > now.getTime()) {
      return NextResponse.json({ error: 'Confirmacao manual permitida somente apos o horario agendado.', reason: 'too_early' }, { status: 409 });
    }

    const nowIso = now.toISOString();
    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        check_in_time: appointment.check_in_time || nowIso,
        check_in_by: appointment.check_in_by || 'admin',
        service_completed_at: nowIso,
        updated_at: nowIso
      })
      .eq('id', appointmentId)
      .eq('barbershop_id', barbershopId)
      .in('status', ['pending', 'confirmed'])
      .select('id,status,start_datetime,check_in_time,check_in_by,service_completed_at')
      .single();

    if (updateError) throw updateError;
    return NextResponse.json({ ok: true, appointment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'confirm_service_failed' }, { status: 500 });
  }
}
