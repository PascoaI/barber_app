import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { overlaps, toUtcIso } from '@/lib/server/appointment-core';
import { getOptionalSessionProfile } from '@/lib/server/request-auth';
import { logger } from '@/lib/observability/logger';
import { startTrace } from '@/lib/observability/tracing';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  const trace = startTrace('appointments.validate_slot');
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ valid: false, reason: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ valid: false, reason: csrf.message }, { status: 403 });

    const limit = checkRateLimit({
      key: `api:appointments:validate-slot:${getClientIp(req)}`,
      limit: 120,
      windowMs: 60 * 1000,
      blockMs: 2 * 60 * 1000
    });
    if (!limit.allowed) return NextResponse.json({ valid: false, reason: 'rate_limited' }, { status: 429 });

    const body = await req.json();
    const session = await getOptionalSessionProfile(req);
    if (!session?.id) return NextResponse.json({ valid: false, reason: 'not_authenticated' }, { status: 401 });

    const { barber_id, start_datetime, duration_minutes, editing_appointment_id = null } = body || {};
    const barbershop_id = session.barbershop_id || body?.barbershop_id || body?.tenant_id || body?.unit_id;

    if (!barbershop_id || !barber_id || !start_datetime || !duration_minutes) {
      return NextResponse.json({ valid: false, reason: 'missing_required_fields' }, { status: 400 });
    }

    const startIso = toUtcIso(start_datetime);
    if (!startIso) return NextResponse.json({ valid: false, reason: 'invalid_datetime_range' }, { status: 400 });

    const start = new Date(startIso);
    const end = new Date(start.getTime() + Number(duration_minutes) * 60000);
    if (Number.isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ valid: false, reason: 'invalid_datetime_range' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: settingsRows } = await supabase
      .from('unit_settings')
      .select('opening_time,closing_time,min_advance_minutes,buffer_between_appointments_minutes,timezone_offset_minutes')
      .eq('barbershop_id', String(barbershop_id))
      .limit(1);

    const settings = (settingsRows as any[])?.[0] || {};
    const minAdvanceMinutes = Number(settings.min_advance_minutes || 60);
    const bufferMinutes = Number(settings.buffer_between_appointments_minutes || 0);

    if (start.getTime() < Date.now() + minAdvanceMinutes * 60000) {
      return NextResponse.json({ valid: false, reason: 'min_advance_not_met' });
    }

    const openTime = String(settings.opening_time || '08:00');
    const closeTime = String(settings.closing_time || '20:00');
    const timezoneOffsetMinutes = Number(settings.timezone_offset_minutes ?? -180);

    const localStartMs = start.getTime() + timezoneOffsetMinutes * 60000;
    const localDate = new Date(localStartMs);
    const y = localDate.getUTCFullYear();
    const m = localDate.getUTCMonth();
    const d = localDate.getUTCDate();

    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);

    const openUtcMs = Date.UTC(y, m, d, openH, openM) - timezoneOffsetMinutes * 60000;
    const closeUtcMs = Date.UTC(y, m, d, closeH, closeM) - timezoneOffsetMinutes * 60000;

    if (start.getTime() < openUtcMs || end.getTime() > closeUtcMs) {
      return NextResponse.json({ valid: false, reason: 'outside_working_hours' });
    }

    const { data: appts } = await supabase
      .from('appointments')
      .select('id,start_datetime,end_datetime,status,barber_id')
      .eq('barbershop_id', String(barbershop_id))
      .eq('barber_id', String(barber_id))
      .in('status', ['awaiting_payment', 'pending', 'confirmed']);

    const conflicts = (appts || []).some((a: any) => {
      if (editing_appointment_id && String(a.id) === String(editing_appointment_id)) return false;
      const aStart = new Date(new Date(a.start_datetime).getTime() - bufferMinutes * 60000);
      const aEnd = new Date(new Date(a.end_datetime).getTime() + bufferMinutes * 60000);
      return overlaps(start, end, aStart, aEnd);
    });
    if (conflicts) return NextResponse.json({ valid: false, reason: 'appointment_overlap' });

    const { data: blocked } = await supabase
      .from('blocked_slots')
      .select('id,start_datetime,end_datetime,barber_id')
      .eq('barbershop_id', String(barbershop_id))
      .eq('barber_id', String(barber_id));

    const blockedConflict = (blocked || []).some((b: any) => overlaps(start, end, new Date(b.start_datetime), new Date(b.end_datetime)));
    if (blockedConflict) return NextResponse.json({ valid: false, reason: 'blocked_slot_conflict' });

    return NextResponse.json({ valid: true, normalized_start_datetime: start.toISOString(), normalized_end_datetime: end.toISOString() });
  } catch (error: any) {
    logger.error('Slot validation failed.', {
      traceId: trace.traceId,
      error: error?.message || 'validation_failed'
    });
    return NextResponse.json({ valid: false, reason: 'validation_failed', error: error?.message }, { status: 500 });
  } finally {
    logger.info('Slot validation finished.', trace.end());
  }
}
