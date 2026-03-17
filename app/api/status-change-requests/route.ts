import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getOptionalSessionProfile } from '@/lib/server/request-auth';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const ALLOWED_REQUESTED_STATUSES = ['confirmed', 'no_show', 'canceled'] as const;

async function resolveSessionBarberId(session: any, supabase: any, barbershopId: string) {
  if (session?.role !== 'barber') return null;
  const { data: rows, error } = await supabase
    .from('barbers')
    .select('id,name,email,users(id,email)')
    .eq('barbershop_id', barbershopId)
    .eq('active', true);
  if (error) throw error;
  const barbers = (rows || []) as any[];
  const byId = barbers.find((row) => String(row.id) === String(session.id));
  const byUserId = barbers.find((row) => String(row?.users?.id || '') === String(session.id));
  const byEmail = barbers.find((row) => String(row?.users?.email || '').toLowerCase() === String(session.email || '').toLowerCase());
  const fallback = barbers.length === 1 ? barbers[0] : null;
  return byId || byUserId || byEmail || fallback || null;
}

export async function GET(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, error: sameOrigin.message }, { status: 403 });

    const limit = await checkRateLimit({
      key: `api:status-change-requests:get:${getClientIp(req)}`,
      limit: 120,
      windowMs: 60 * 1000,
      blockMs: 2 * 60 * 1000
    });
    if (!limit.allowed) return NextResponse.json({ ok: false, error: 'Muitas tentativas. Aguarde alguns instantes.' }, { status: 429 });

    const session = await getOptionalSessionProfile(req);
    if (!session?.id) return NextResponse.json({ ok: false, error: 'Nao autenticado.' }, { status: 401 });
    if (!['barber', 'admin', 'super_admin'].includes(String(session.role || ''))) {
      return NextResponse.json({ ok: false, error: 'Acesso restrito.' }, { status: 403 });
    }

    const barbershopId = String(session.barbershop_id || session.tenant_id || session.unit_id || '');
    if (!barbershopId) return NextResponse.json({ ok: false, error: 'Sessao sem barbearia associada.' }, { status: 403 });

    const url = new URL(req.url);
    const filterStatus = String(url.searchParams.get('status') || '').trim().toLowerCase();

    const supabase = createSupabaseServerClient();
    let query = supabase
      .from('status_change_requests')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('requested_at', { ascending: false })
      .limit(120);

    if (filterStatus && ['pending', 'approved', 'rejected'].includes(filterStatus)) {
      query = query.eq('status', filterStatus);
    }

    if (session.role === 'barber') {
      const barberRow = await resolveSessionBarberId(session, supabase, barbershopId);
      if (!barberRow?.id) return NextResponse.json({ ok: false, error: 'Barbeiro nao encontrado para sessao.' }, { status: 403 });
      query = query.eq('barber_id', String(barberRow.id));
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, requests: data || [] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'status_change_requests_get_failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, error: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.message }, { status: 403 });

    const limit = await checkRateLimit({
      key: `api:status-change-requests:post:${getClientIp(req)}`,
      limit: 40,
      windowMs: 60 * 1000,
      blockMs: 4 * 60 * 1000
    });
    if (!limit.allowed) return NextResponse.json({ ok: false, error: 'Muitas tentativas. Aguarde alguns instantes.' }, { status: 429 });

    const session = await getOptionalSessionProfile(req);
    if (!session?.id) return NextResponse.json({ ok: false, error: 'Nao autenticado.' }, { status: 401 });
    if (!['barber', 'admin', 'super_admin'].includes(String(session.role || ''))) {
      return NextResponse.json({ ok: false, error: 'Acesso restrito.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const appointmentId = String(body?.appointment_id || '').trim();
    const requestedStatus = String(body?.requested_status || '').trim().toLowerCase();
    const reason = String(body?.reason || '').trim();
    if (!appointmentId) return NextResponse.json({ ok: false, error: 'appointment_id obrigatorio.' }, { status: 400 });
    if (!ALLOWED_REQUESTED_STATUSES.includes(requestedStatus as any)) {
      return NextResponse.json({ ok: false, error: 'requested_status invalido.' }, { status: 400 });
    }
    if (!reason) return NextResponse.json({ ok: false, error: 'Motivo obrigatorio para solicitacao.' }, { status: 400 });

    const barbershopId = String(session.barbershop_id || session.tenant_id || session.unit_id || '');
    if (!barbershopId) return NextResponse.json({ ok: false, error: 'Sessao sem barbearia associada.' }, { status: 403 });

    const supabase = createSupabaseServerClient();
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id,barbershop_id,barber_id,client_id,status,client_name,service_name,users(name,email),barbers(name,email,users(name,email))')
      .eq('id', appointmentId)
      .eq('barbershop_id', barbershopId)
      .maybeSingle();
    if (appointmentError) throw appointmentError;
    if (!appointment?.id) return NextResponse.json({ ok: false, error: 'Agendamento nao encontrado.' }, { status: 404 });

    let barberRow: any = null;
    if (session.role === 'barber') {
      barberRow = await resolveSessionBarberId(session, supabase, barbershopId);
      if (!barberRow?.id) return NextResponse.json({ ok: false, error: 'Barbeiro nao encontrado para sessao.' }, { status: 403 });
      if (String(appointment.barber_id || '') !== String(barberRow.id)) {
        return NextResponse.json({ ok: false, error: 'Sem permissao para solicitar neste agendamento.' }, { status: 403 });
      }
    }

    const appointmentAny = appointment as any;
    const barberMeta = Array.isArray(appointmentAny?.barbers) ? appointmentAny.barbers[0] : appointmentAny?.barbers;
    const barberUserMeta = Array.isArray(barberMeta?.users) ? barberMeta.users[0] : barberMeta?.users;
    const clientMeta = Array.isArray(appointmentAny?.users) ? appointmentAny.users[0] : appointmentAny?.users;

    const nowIso = new Date().toISOString();
    const payload: Record<string, any> = {
      barbershop_id: barbershopId,
      appointment_id: appointmentId,
      barber_id: String(appointment.barber_id || barberRow?.id || ''),
      barber_name: String(barberMeta?.name || barberUserMeta?.name || barberRow?.name || session.email || ''),
      barber_email: String(barberMeta?.email || barberUserMeta?.email || barberRow?.email || session.email || ''),
      client_id: appointment.client_id ? String(appointment.client_id) : null,
      client_name: String(appointment.client_name || clientMeta?.name || clientMeta?.email || ''),
      client_email: String(clientMeta?.email || ''),
      current_status: String(appointment.status || ''),
      requested_status: requestedStatus,
      reason,
      requested_by_user_id: String(session.id),
      requested_at: nowIso,
      status: 'pending',
      created_at: nowIso,
      updated_at: nowIso
    };

    const { data: inserted, error: insertError } = await supabase
      .from('status_change_requests')
      .insert(payload)
      .select('*')
      .single();
    if (insertError) throw insertError;

    return NextResponse.json({ ok: true, request: inserted });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'status_change_requests_post_failed' }, { status: 500 });
  }
}
