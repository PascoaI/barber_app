import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validateAppointmentCreation } from '@/lib/server/appointment-core';
import { getOptionalSessionProfile } from '@/lib/server/request-auth';
import { logger } from '@/lib/observability/logger';
import { startTrace } from '@/lib/observability/tracing';
import { sendOperationalAlert } from '@/lib/observability/alerts';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  const trace = startTrace('appointments.create');
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ error: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

    const limit = await checkRateLimit({
      key: `api:appointments:create:${getClientIp(req)}`,
      limit: 60,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas de agendamento. Aguarde alguns instantes.' }, { status: 429 });
    }

    const body = await req.json();
    const session = await getOptionalSessionProfile(req);
    if (!session?.id) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
    }

    const { idempotency_key, barber_id } = body || {};
    const barbershop_id = session.barbershop_id || body?.barbershop_id || body?.tenant_id || body?.unit_id;
    const client_id = session?.role === 'client' ? session.id : (body?.client_id ?? session?.id);

    if (!idempotency_key || !barbershop_id || !barber_id) {
      return NextResponse.json({ error: 'missing idempotency_key/barbershop_id/barber_id' }, { status: 400 });
    }

    if (session?.role === 'client' && body?.client_id && String(body.client_id) !== String(session.id)) {
      return NextResponse.json({ error: 'client_scope_mismatch' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();

    const scopedBody = {
      ...body,
      barbershop_id,
      tenant_id: body?.tenant_id || barbershop_id,
      unit_id: body?.unit_id || barbershop_id,
      client_id
    };

    const { data: existingByIdempotency } = await supabase
      .from('appointments')
      .select('*')
      .eq('barbershop_id', String(barbershop_id))
      .eq('idempotency_key', String(idempotency_key))
      .limit(1)
      .maybeSingle();

    if (existingByIdempotency) {
      return NextResponse.json({ ok: true, duplicated: true, appointment: existingByIdempotency });
    }

    const [{ data: existingAppointments }, { data: blockedSlots }] = await Promise.all([
      supabase
        .from('appointments')
        .select('id,start_datetime,end_datetime,status')
        .eq('barbershop_id', String(barbershop_id))
        .eq('barber_id', String(barber_id))
        .in('status', ['awaiting_payment', 'pending', 'confirmed']),
      supabase
        .from('blocked_slots')
        .select('start_datetime,end_datetime')
        .eq('barbershop_id', String(barbershop_id))
        .eq('barber_id', String(barber_id))
    ]);

    let blockedUntil: string | null = null;
    let subscriptionStatus: string | null = null;

    if (client_id) {
      const { data: clientRow } = await supabase
        .from('users')
        .select('blocked_until')
        .eq('id', String(client_id))
        .eq('barbershop_id', String(barbershop_id))
        .maybeSingle();
      blockedUntil = (clientRow as any)?.blocked_until || null;

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('barbershop_id', String(barbershop_id))
        .eq('user_id', String(client_id))
        .order('created_at', { ascending: false })
        .limit(1)
        .returns<Array<{ status: string }>>();
      subscriptionStatus = subscriptions?.[0]?.status || null;
    }

    const validation = validateAppointmentCreation({
      payload: scopedBody,
      existingAppointments: existingAppointments || [],
      blockedSlots: blockedSlots || [],
      blockedUntil,
      subscriptionStatus
    });

    if (!validation.ok) {
      return NextResponse.json({ ok: false, reason: validation.reason }, { status: 409 });
    }

    const { data: created, error: createdError } = await supabase
      .from('appointments')
      .insert(validation.normalized || scopedBody)
      .select('*')
      .single();

    if (createdError) throw createdError;

    logger.info('Appointment created.', {
      traceId: trace.traceId,
      barbershopId: String(barbershop_id),
      appointmentId: String(created?.id || ''),
      clientId: String(client_id || '')
    });

    return NextResponse.json({ ok: true, duplicated: false, appointment: created || null });
  } catch (error: any) {
    logger.error('Appointment create failed.', {
      traceId: trace.traceId,
      error: error?.message || 'create_failed'
    });

    await sendOperationalAlert('appointment_create_failed', {
      traceId: trace.traceId,
      error: error?.message || 'create_failed'
    });

    return NextResponse.json({ error: error?.message || 'create_failed' }, { status: 500 });
  } finally {
    logger.info('Appointment create finished.', trace.end());
  }
}
