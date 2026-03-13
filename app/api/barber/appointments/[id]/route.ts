import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canTransitionStatus } from '@/lib/appointments-policy';
import { overlaps, toUtcIso } from '@/lib/server/appointment-core';
import { getOptionalSessionProfile } from '@/lib/server/request-auth';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const ACTIVE_CONFLICT_STATUSES = ['awaiting_payment', 'pending', 'confirmed', 'in_progress'];
const STATUS_ACTIONS = ['in_progress', 'completed', 'no_show', 'canceled'] as const;

type AllowedStatus = typeof STATUS_ACTIONS[number];

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

async function resolveSessionBarberId(session: any, supabase: any, barbershopId: string) {
  if (session?.role !== 'barber') return null;
  const { data: rows, error } = await supabase
    .from('barbers')
    .select('id,name,users(id,email)')
    .eq('barbershop_id', barbershopId)
    .eq('active', true);
  if (error) throw error;

  const barbers = (rows || []) as any[];
  const byId = barbers.find((row) => String(row.id) === String(session.id));
  const byUserId = barbers.find((row) => String(row?.users?.id || '') === String(session.id));
  const byEmail = barbers.find((row) => String(row?.users?.email || '').toLowerCase() === String(session.email || '').toLowerCase());
  const fallback = barbers.length === 1 ? barbers[0] : null;
  const selected = byId || byUserId || byEmail || fallback;
  return selected?.id ? String(selected.id) : null;
}

function normalizeStatus(value: unknown): AllowedStatus | null {
  const normalized = String(value || '').trim().toLowerCase();
  if (!STATUS_ACTIONS.includes(normalized as AllowedStatus)) return null;
  return normalized as AllowedStatus;
}

async function assertPermissionForAppointment(input: {
  session: any;
  supabase: any;
  barbershopId: string;
  appointment: any;
}) {
  const { session, supabase, barbershopId, appointment } = input;
  if (session?.role === 'admin' || session?.role === 'super_admin') {
    return { actorRole: 'admin', actorId: String(session.id) };
  }
  if (session?.role !== 'barber') {
    throw new Error('Acesso restrito ao barbeiro/admin.');
  }
  const sessionBarberId = await resolveSessionBarberId(session, supabase, barbershopId);
  if (!sessionBarberId) throw new Error('Barbeiro nao encontrado para o usuario logado.');
  if (String(appointment?.barber_id || '') !== sessionBarberId) {
    throw new Error('Barbeiro sem permissao para operar este agendamento.');
  }
  return { actorRole: 'barber', actorId: sessionBarberId };
}

async function loadAppointmentContext(supabase: any, barbershopId: string, appointmentId: string) {
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('id,barbershop_id,barber_id,client_id,service_id,start_datetime,end_datetime,status,status_reason,notes,service_name,service_price,check_in_time,check_in_by,service_completed_at,delay_minutes,delay_reason,users(name,email),services(name,price,duration_minutes),barbers(users(name))')
    .eq('id', appointmentId)
    .eq('barbershop_id', barbershopId)
    .maybeSingle();
  if (error) throw error;
  return appointment;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, error: sameOrigin.message }, { status: 403 });

    const limit = await checkRateLimit({
      key: `api:barber:appointments:get:${getClientIp(req)}`,
      limit: 120,
      windowMs: 60 * 1000,
      blockMs: 2 * 60 * 1000
    });
    if (!limit.allowed) return NextResponse.json({ ok: false, error: 'Muitas tentativas. Aguarde alguns instantes.' }, { status: 429 });

    const session = await getOptionalSessionProfile(req);
    if (!session?.id) return NextResponse.json({ ok: false, error: 'Nao autenticado.' }, { status: 401 });
    if (!['barber', 'admin', 'super_admin'].includes(String(session.role || ''))) {
      return NextResponse.json({ ok: false, error: 'Acesso restrito ao barbeiro/admin.' }, { status: 403 });
    }

    const appointmentId = String(params?.id || '').trim();
    if (!appointmentId) return NextResponse.json({ ok: false, error: 'appointment_id obrigatorio.' }, { status: 400 });

    const barbershopId = String(session.barbershop_id || session.tenant_id || session.unit_id || '');
    if (!barbershopId) return NextResponse.json({ ok: false, error: 'Sessao sem barbearia associada.' }, { status: 403 });

    const supabase = createSupabaseServerClient();
    const appointment = await loadAppointmentContext(supabase, barbershopId, appointmentId);
    if (!appointment?.id) return NextResponse.json({ ok: false, error: 'Agendamento nao encontrado.' }, { status: 404 });

    await assertPermissionForAppointment({ session, supabase, barbershopId, appointment });

    const { data: history, error: historyError } = await supabase
      .from('appointments')
      .select('id,start_datetime,status,service_name,notes,service_price,services(name),barbers(users(name))')
      .eq('barbershop_id', barbershopId)
      .eq('client_id', String(appointment.client_id))
      .order('start_datetime', { ascending: false })
      .limit(8);
    if (historyError) throw historyError;

    const rows = (history || []) as any[];
    const lastServices = Array.from(
      new Map(
        rows
          .map((row) => [String(row.service_name || row?.services?.name || 'Servico'), row])
      ).values()
    ).slice(0, 3);

    return NextResponse.json({
      ok: true,
      context: {
        appointment,
        history: rows,
        lastServices
      }
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'barber_appointment_context_failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, error: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.message }, { status: 403 });

    const limit = await checkRateLimit({
      key: `api:barber:appointments:patch:${getClientIp(req)}`,
      limit: 80,
      windowMs: 60 * 1000,
      blockMs: 3 * 60 * 1000
    });
    if (!limit.allowed) return NextResponse.json({ ok: false, error: 'Muitas tentativas. Aguarde alguns instantes.' }, { status: 429 });

    const session = await getOptionalSessionProfile(req);
    if (!session?.id) return NextResponse.json({ ok: false, error: 'Nao autenticado.' }, { status: 401 });
    if (!['barber', 'admin', 'super_admin'].includes(String(session.role || ''))) {
      return NextResponse.json({ ok: false, error: 'Acesso restrito ao barbeiro/admin.' }, { status: 403 });
    }

    const appointmentId = String(params?.id || '').trim();
    if (!appointmentId) return NextResponse.json({ ok: false, error: 'appointment_id obrigatorio.' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '').trim().toLowerCase();
    if (!action) return NextResponse.json({ ok: false, error: 'action obrigatoria.' }, { status: 400 });

    const barbershopId = String(session.barbershop_id || session.tenant_id || session.unit_id || '');
    if (!barbershopId) return NextResponse.json({ ok: false, error: 'Sessao sem barbearia associada.' }, { status: 403 });

    const supabase = createSupabaseServerClient();
    const appointment = await loadAppointmentContext(supabase, barbershopId, appointmentId);
    if (!appointment?.id) return NextResponse.json({ ok: false, error: 'Agendamento nao encontrado.' }, { status: 404 });

    const actor = await assertPermissionForAppointment({ session, supabase, barbershopId, appointment });
    const nowIso = new Date().toISOString();
    const updatedBy = String(session.email || actor.actorRole || 'barber');

    if (action === 'status') {
      const toStatus = normalizeStatus(body?.to_status);
      if (!toStatus) return NextResponse.json({ ok: false, error: 'to_status invalido.' }, { status: 400 });

      const currentStatus = String(appointment.status || '').toLowerCase();
      if (!canTransitionStatus(currentStatus, toStatus)) {
        return NextResponse.json({ ok: false, error: 'Transicao de status invalida.', reason: 'invalid_transition' }, { status: 409 });
      }

      const reason = String(body?.reason || '').trim();
      if (['no_show', 'canceled'].includes(toStatus) && !reason) {
        return NextResponse.json({ ok: false, error: 'Justificativa obrigatoria para no-show/cancelamento.', reason: 'missing_reason' }, { status: 400 });
      }

      const patch: Record<string, any> = {
        status: toStatus,
        status_reason: reason || null,
        updated_at: nowIso,
        updated_by: updatedBy
      };
      if (toStatus === 'in_progress') {
        patch.check_in_time = appointment.check_in_time || nowIso;
        patch.check_in_by = appointment.check_in_by || actor.actorRole;
      }
      if (toStatus === 'completed') {
        patch.check_in_time = appointment.check_in_time || nowIso;
        patch.check_in_by = appointment.check_in_by || actor.actorRole;
        patch.service_completed_at = nowIso;
      }

      const { data: updated, error: updateError } = await supabase
        .from('appointments')
        .update(patch)
        .eq('id', appointmentId)
        .eq('barbershop_id', barbershopId)
        .select('id,status,status_reason,delay_minutes,delay_reason,start_datetime,end_datetime,barber_id,service_completed_at')
        .single();
      if (updateError) throw updateError;
      return NextResponse.json({ ok: true, appointment: updated });
    }

    if (action === 'delay') {
      const delayMinutes = Math.max(0, toNumber(body?.delay_minutes, 0));
      if (!delayMinutes) {
        return NextResponse.json({ ok: false, error: 'delay_minutes deve ser maior que zero.' }, { status: 400 });
      }
      const delayReason = String(body?.delay_reason || '').trim() || null;

      const { data: updated, error: updateError } = await supabase
        .from('appointments')
        .update({
          delay_minutes: delayMinutes,
          delay_reason: delayReason,
          updated_at: nowIso,
          updated_by: updatedBy
        })
        .eq('id', appointmentId)
        .eq('barbershop_id', barbershopId)
        .select('id,status,delay_minutes,delay_reason,start_datetime,end_datetime,barber_id')
        .single();
      if (updateError) throw updateError;
      return NextResponse.json({ ok: true, appointment: updated });
    }

    if (action === 'reschedule') {
      const startIso = toUtcIso(body?.start_datetime);
      if (!startIso) {
        return NextResponse.json({ ok: false, error: 'start_datetime invalido.' }, { status: 400 });
      }

      const currentStatus = String(appointment.status || '').toLowerCase();
      if (!['awaiting_payment', 'pending', 'confirmed', 'no_show'].includes(currentStatus)) {
        return NextResponse.json({ ok: false, error: 'Status nao permite remarcacao operacional.', reason: 'invalid_status' }, { status: 409 });
      }

      const baseStart = readStartDate(appointment);
      const baseEnd = readEndDate(appointment, 30);
      const baseDuration = Math.max(5, Math.round((baseEnd.getTime() - baseStart.getTime()) / 60000) || 30);
      const durationMinutes = Math.max(5, toNumber(body?.duration_minutes, baseDuration));

      const nextStart = new Date(startIso);
      const nextEnd = body?.end_datetime ? new Date(String(body.end_datetime)) : new Date(nextStart.getTime() + durationMinutes * 60000);
      if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime()) || nextEnd <= nextStart) {
        return NextResponse.json({ ok: false, error: 'Janela de horario invalida.', reason: 'invalid_datetime_range' }, { status: 400 });
      }
      if (nextStart.getTime() < Date.now() + 5 * 60000) {
        return NextResponse.json({ ok: false, error: 'Remarcacao exige horario futuro.', reason: 'min_advance_not_met' }, { status: 409 });
      }

      const [{ data: settingsRows }, { data: appointments }, { data: blockedSlots }] = await Promise.all([
        supabase
          .from('unit_settings')
          .select('*')
          .eq('barbershop_id', barbershopId)
          .limit(1),
        supabase
          .from('appointments')
          .select('id,start_datetime,end_datetime,status')
          .eq('barbershop_id', barbershopId)
          .eq('barber_id', String(appointment.barber_id))
          .in('status', ACTIVE_CONFLICT_STATUSES),
        supabase
          .from('blocked_slots')
          .select('start_datetime,end_datetime,start_time,end_time')
          .eq('barbershop_id', barbershopId)
          .eq('barber_id', String(appointment.barber_id))
      ]);

      const settings = (settingsRows as any[])?.[0] || {};
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
        return NextResponse.json({ ok: false, error: 'Horario fora do expediente da barbearia.', reason: 'outside_working_hours' }, { status: 409 });
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
      if (conflict) return NextResponse.json({ ok: false, error: 'Conflito com outro agendamento.', reason: 'appointment_overlap' }, { status: 409 });

      const blockedConflict = (blockedSlots || []).some((row: any) => {
        const start = readStartDate({ start_datetime: row?.start_datetime || row?.start_time });
        const end = readEndDate({ end_datetime: row?.end_datetime || row?.end_time }, durationMinutes);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        return overlaps(nextStart, nextEnd, start, end);
      });
      if (blockedConflict) return NextResponse.json({ ok: false, error: 'Horario bloqueado pelo admin da barbearia.', reason: 'blocked_slot_conflict' }, { status: 409 });

      const { data: updated, error: updateError } = await supabase
        .from('appointments')
        .update({
          start_datetime: nextStart.toISOString(),
          end_datetime: nextEnd.toISOString(),
          status: 'pending',
          rescheduled_from: String(appointment.start_datetime || '') || null,
          rescheduled_by: actor.actorRole,
          status_reason: null,
          updated_at: nowIso,
          updated_by: updatedBy
        })
        .eq('id', appointmentId)
        .eq('barbershop_id', barbershopId)
        .select('id,status,start_datetime,end_datetime,barber_id,rescheduled_from,rescheduled_by')
        .single();
      if (updateError) throw updateError;
      return NextResponse.json({ ok: true, appointment: updated });
    }

    if (action === 'transfer') {
      const toBarberId = String(body?.to_barber_id || '').trim();
      if (!toBarberId) {
        return NextResponse.json({ ok: false, error: 'to_barber_id obrigatorio.' }, { status: 400 });
      }

      const currentStatus = String(appointment.status || '').toLowerCase();
      if (!['awaiting_payment', 'pending', 'confirmed', 'in_progress'].includes(currentStatus)) {
        return NextResponse.json({ ok: false, error: 'Status nao permite transferencia.', reason: 'invalid_status' }, { status: 409 });
      }

      if (String(appointment.barber_id || '') === toBarberId) {
        return NextResponse.json({ ok: false, error: 'Barbeiro de destino deve ser diferente do atual.' }, { status: 400 });
      }

      const { data: targetBarber, error: barberError } = await supabase
        .from('barbers')
        .select('id,name,active')
        .eq('barbershop_id', barbershopId)
        .eq('id', toBarberId)
        .eq('active', true)
        .maybeSingle();
      if (barberError) throw barberError;
      if (!targetBarber?.id) {
        return NextResponse.json({ ok: false, error: 'Barbeiro de destino nao encontrado/ativo.' }, { status: 404 });
      }

      const currentStart = readStartDate(appointment);
      const currentEnd = readEndDate(appointment, 30);
      const durationMinutes = Math.max(5, Math.round((currentEnd.getTime() - currentStart.getTime()) / 60000) || 30);
      const chosenStartIso = body?.start_datetime ? toUtcIso(body.start_datetime) : null;
      const nextStart = chosenStartIso ? new Date(chosenStartIso) : currentStart;
      const nextEnd = chosenStartIso
        ? (body?.end_datetime ? new Date(String(body.end_datetime)) : new Date(nextStart.getTime() + durationMinutes * 60000))
        : currentEnd;
      if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime()) || nextEnd <= nextStart) {
        return NextResponse.json({ ok: false, error: 'Janela de horario invalida para transferencia.', reason: 'invalid_datetime_range' }, { status: 400 });
      }

      const [{ data: appointments }, { data: blockedSlots }] = await Promise.all([
        supabase
          .from('appointments')
          .select('id,start_datetime,end_datetime,status')
          .eq('barbershop_id', barbershopId)
          .eq('barber_id', toBarberId)
          .in('status', ACTIVE_CONFLICT_STATUSES),
        supabase
          .from('blocked_slots')
          .select('start_datetime,end_datetime,start_time,end_time')
          .eq('barbershop_id', barbershopId)
          .eq('barber_id', toBarberId)
      ]);

      const conflict = (appointments || []).some((row: any) => {
        if (String(row.id) === appointmentId) return false;
        const start = readStartDate(row);
        const end = readEndDate(row, durationMinutes);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        return overlaps(nextStart, nextEnd, start, end);
      });
      if (conflict) return NextResponse.json({ ok: false, error: 'Conflito com agenda do barbeiro de destino.', reason: 'appointment_overlap' }, { status: 409 });

      const blockedConflict = (blockedSlots || []).some((row: any) => {
        const start = readStartDate({ start_datetime: row?.start_datetime || row?.start_time });
        const end = readEndDate({ end_datetime: row?.end_datetime || row?.end_time }, durationMinutes);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        return overlaps(nextStart, nextEnd, start, end);
      });
      if (blockedConflict) return NextResponse.json({ ok: false, error: 'Horario bloqueado para o barbeiro de destino.', reason: 'blocked_slot_conflict' }, { status: 409 });

      const patch: Record<string, any> = {
        barber_id: toBarberId,
        transferred_from_barber_id: String(appointment.barber_id || ''),
        transferred_to_barber_id: toBarberId,
        updated_at: nowIso,
        updated_by: updatedBy
      };
      if (chosenStartIso) {
        patch.start_datetime = nextStart.toISOString();
        patch.end_datetime = nextEnd.toISOString();
        patch.rescheduled_from = String(appointment.start_datetime || '') || null;
        patch.rescheduled_by = actor.actorRole;
      }

      const { data: updated, error: updateError } = await supabase
        .from('appointments')
        .update(patch)
        .eq('id', appointmentId)
        .eq('barbershop_id', barbershopId)
        .select('id,status,start_datetime,end_datetime,barber_id,transferred_from_barber_id,transferred_to_barber_id,rescheduled_from,rescheduled_by')
        .single();
      if (updateError) throw updateError;
      return NextResponse.json({ ok: true, appointment: updated });
    }

    return NextResponse.json({ ok: false, error: 'action desconhecida.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'barber_appointment_patch_failed' }, { status: 500 });
  }
}
