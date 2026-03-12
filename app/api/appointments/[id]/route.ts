import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getOptionalSessionProfile } from '@/lib/server/request-auth';
import { overlaps, toUtcIso } from '@/lib/server/appointment-core';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readStartDate(row: any) {
  return new Date(row?.start_datetime || row?.appointment_date || '');
}

function readEndDate(row: any, fallbackDurationMinutes = 30) {
  const direct = new Date(row?.end_datetime || '');
  if (!Number.isNaN(direct.getTime())) return direct;
  const start = readStartDate(row);
  if (Number.isNaN(start.getTime())) return direct;
  return new Date(start.getTime() + Math.max(5, fallbackDurationMinutes) * 60000);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, error: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.message }, { status: 403 });

    const limit = await checkRateLimit({
      key: `api:appointments:delete:${getClientIp(req)}`,
      limit: 40,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!limit.allowed) return NextResponse.json({ ok: false, error: 'Muitas tentativas. Aguarde alguns instantes.' }, { status: 429 });

    const session = await getOptionalSessionProfile(req);
    if (!session?.id) return NextResponse.json({ ok: false, error: 'Nao autenticado.' }, { status: 401 });
    if (session.role !== 'client') return NextResponse.json({ ok: false, error: 'Apenas cliente pode cancelar por esta rota.' }, { status: 403 });

    const appointmentId = String(params?.id || '').trim();
    if (!appointmentId) return NextResponse.json({ ok: false, error: 'appointment_id obrigatorio.' }, { status: 400 });

    const barbershopId = String(session.barbershop_id || session.tenant_id || session.unit_id || '');
    const supabase = createSupabaseServerClient();

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id,status,client_id,barbershop_id,start_datetime')
      .eq('id', appointmentId)
      .eq('barbershop_id', barbershopId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!appointment?.id) return NextResponse.json({ ok: false, error: 'Agendamento nao encontrado.' }, { status: 404 });
    if (String(appointment.client_id) !== String(session.id)) {
      return NextResponse.json({ ok: false, error: 'Sem permissao para cancelar este agendamento.' }, { status: 403 });
    }
    if (['completed', 'canceled', 'cancelled', 'no_show'].includes(String(appointment.status))) {
      return NextResponse.json({ ok: false, reason: 'invalid_status', error: 'Agendamento nao elegivel para cancelamento.' }, { status: 409 });
    }
    if (new Date(String(appointment.start_datetime || '')).getTime() <= Date.now()) {
      return NextResponse.json({ ok: false, reason: 'too_late', error: 'Cancelamento disponivel apenas antes do horario do atendimento.' }, { status: 409 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('barbershop_id', barbershopId)
      .eq('client_id', session.id)
      .select('id,status,start_datetime,end_datetime')
      .single();

    if (updateError) throw updateError;
    return NextResponse.json({ ok: true, appointment: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'cancel_failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, error: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.message }, { status: 403 });

    const limit = await checkRateLimit({
      key: `api:appointments:patch:${getClientIp(req)}`,
      limit: 50,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!limit.allowed) return NextResponse.json({ ok: false, error: 'Muitas tentativas. Aguarde alguns instantes.' }, { status: 429 });

    const session = await getOptionalSessionProfile(req);
    if (!session?.id) return NextResponse.json({ ok: false, error: 'Nao autenticado.' }, { status: 401 });
    if (session.role !== 'client') return NextResponse.json({ ok: false, error: 'Apenas cliente pode reagendar por esta rota.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const appointmentId = String(params?.id || '').trim();
    const startIso = toUtcIso(body?.start_datetime);
    if (!appointmentId || !startIso) {
      return NextResponse.json({ ok: false, reason: 'missing_fields', error: 'appointment_id e start_datetime sao obrigatorios.' }, { status: 400 });
    }

    const barbershopId = String(session.barbershop_id || session.tenant_id || session.unit_id || '');
    const supabase = createSupabaseServerClient();

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('barbershop_id', barbershopId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!appointment?.id) return NextResponse.json({ ok: false, error: 'Agendamento nao encontrado.' }, { status: 404 });
    if (String(appointment.client_id) !== String(session.id)) {
      return NextResponse.json({ ok: false, error: 'Sem permissao para reagendar este agendamento.' }, { status: 403 });
    }
    if (!['pending', 'confirmed', 'awaiting_payment'].includes(String(appointment.status || ''))) {
      return NextResponse.json({ ok: false, reason: 'invalid_status', error: 'Apenas agendamentos pendentes/confirmados podem ser reagendados.' }, { status: 409 });
    }

    const baseStart = readStartDate(appointment);
    const baseEnd = readEndDate(appointment, toNumber(body?.duration_minutes, 30));
    const baseDuration = Math.max(5, Math.round((baseEnd.getTime() - baseStart.getTime()) / 60000) || 30);
    const durationMinutes = Math.max(5, toNumber(body?.duration_minutes, baseDuration));
    const nextStart = new Date(startIso);
    const nextEnd = body?.end_datetime ? new Date(String(body.end_datetime)) : new Date(nextStart.getTime() + durationMinutes * 60000);
    if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime()) || nextEnd <= nextStart) {
      return NextResponse.json({ ok: false, reason: 'invalid_datetime_range', error: 'Janela de horario invalida.' }, { status: 400 });
    }

    const [{ data: settingsRows }, { data: appointments }, { data: blockedSlots }] = await Promise.all([
      supabase
        .from('unit_settings')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .limit(1),
      supabase
        .from('appointments')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('barber_id', String(appointment.barber_id))
        .in('status', ['awaiting_payment', 'pending', 'confirmed']),
      supabase
        .from('blocked_slots')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('barber_id', String(appointment.barber_id))
    ]);

    const settings = (settingsRows as any[])?.[0] || {};
    const minAdvanceMinutes = Math.max(0, toNumber(settings.min_advance_minutes, 60));
    if (nextStart.getTime() < Date.now() + minAdvanceMinutes * 60000) {
      return NextResponse.json({ ok: false, reason: 'min_advance_not_met', error: 'Horario invalido para reagendamento.' }, { status: 409 });
    }

    const openTime = String(settings.opening_time || '08:00');
    const closeTime = String(settings.closing_time || '20:00');
    const timezoneOffsetMinutes = toNumber(settings.timezone_offset_minutes, -180);
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);

    const localStartMs = nextStart.getTime() + timezoneOffsetMinutes * 60000;
    const localDate = new Date(localStartMs);
    const y = localDate.getUTCFullYear();
    const m = localDate.getUTCMonth();
    const d = localDate.getUTCDate();
    const openUtcMs = Date.UTC(y, m, d, openH, openM) - timezoneOffsetMinutes * 60000;
    const closeUtcMs = Date.UTC(y, m, d, closeH, closeM) - timezoneOffsetMinutes * 60000;

    if (nextStart.getTime() < openUtcMs || nextEnd.getTime() > closeUtcMs) {
      return NextResponse.json({ ok: false, reason: 'outside_working_hours', error: 'Horario fora do expediente da barbearia.' }, { status: 409 });
    }

    const bufferMinutes = Math.max(0, toNumber(settings.buffer_between_appointments_minutes, 0));
    const conflict = (appointments || []).some((row: any) => {
      if (String(row.id) === appointmentId) return false;
      const start = readStartDate(row);
      const end = readEndDate(row, durationMinutes);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
      const bufferedStart = new Date(start.getTime() - bufferMinutes * 60000);
      const bufferedEnd = new Date(end.getTime() + bufferMinutes * 60000);
      return overlaps(nextStart, nextEnd, bufferedStart, bufferedEnd);
    });
    if (conflict) {
      return NextResponse.json({ ok: false, reason: 'appointment_overlap', error: 'Conflito com outro agendamento.' }, { status: 409 });
    }

    const blockedConflict = (blockedSlots || []).some((row: any) => {
      const start = readStartDate({ start_datetime: row?.start_datetime || row?.start_time });
      const end = readEndDate({ end_datetime: row?.end_datetime || row?.end_time }, durationMinutes);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
      return overlaps(nextStart, nextEnd, start, end);
    });
    if (blockedConflict) {
      return NextResponse.json({ ok: false, reason: 'blocked_slot_conflict', error: 'Horario bloqueado pelo profissional.' }, { status: 409 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({
        start_datetime: nextStart.toISOString(),
        end_datetime: nextEnd.toISOString(),
        updated_at: new Date().toISOString(),
        status: 'pending'
      })
      .eq('id', appointmentId)
      .eq('barbershop_id', barbershopId)
      .eq('client_id', session.id)
      .select('id,status,start_datetime,end_datetime')
      .single();

    if (updateError) throw updateError;
    return NextResponse.json({ ok: true, appointment: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'reschedule_failed' }, { status: 500 });
  }
}
