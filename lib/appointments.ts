'use client';

import { getCurrentUserContext } from '@/lib/auth';
import { supabaseClient } from '@/lib/supabaseClient';
import { withCsrfHeaders } from '@/lib/security/csrf-client';
import { enqueuePendingBooking } from '@/lib/booking/offline-outbox';

const UPCOMING_STATUSES = ['pending', 'confirmed', 'awaiting_payment'];

export function getCheckInWindowState(startDatetime: string, now = new Date()) {
  const start = new Date(startDatetime);
  if (Number.isNaN(start.getTime())) {
    return { available: false, minutesToStart: null as number | null };
  }
  const minutesToStart = (start.getTime() - now.getTime()) / 60000;
  const available = minutesToStart >= 20 && minutesToStart <= 30;
  return { available, minutesToStart };
}

export async function getNextAppointment() {
  const user = await getCurrentUserContext();
  const scopeBarbershopId = String(user.barbershop_id || user.tenant_id || user.unit_id || '');
  const supabase = supabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('appointments')
    .select('id, start_datetime, end_datetime, status, service_id, barber_id, services(name,price), barbers(users(name))')
    .eq('barbershop_id', scopeBarbershopId)
    .eq('client_id', String(user.id))
    .in('status', UPCOMING_STATUSES)
    .gte('start_datetime', now)
    .order('start_datetime', { ascending: true })
    .limit(1)
    .single();

  if (error && !String(error.message || '').includes('0 rows')) throw error;
  return data || null;
}

export async function listClientHistory(filters: {
  status?: string;
  barber_id?: string;
  from?: string;
  to?: string;
}) {
  const user = await getCurrentUserContext();
  const scopeBarbershopId = String(user.barbershop_id || user.tenant_id || user.unit_id || '');
  const supabase = supabaseClient();
  let query = supabase
    .from('appointments')
    .select('id,start_datetime,end_datetime,status,barber_id,service_id,barbers(users(name)),services(name,price)')
    .eq('barbershop_id', scopeBarbershopId)
    .eq('client_id', String(user.id))
    .order('start_datetime', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.barber_id) query = query.eq('barber_id', filters.barber_id);
  if (filters.from) query = query.gte('start_datetime', `${filters.from}T00:00:00`);
  if (filters.to) query = query.lte('start_datetime', `${filters.to}T23:59:59`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createAppointmentSafe(payload: Record<string, any>) {
  const user = await getCurrentUserContext();
  if (user.blocked_until && new Date(user.blocked_until) > new Date()) {
    throw new Error(`Cliente bloqueado para agendamento até ${new Date(user.blocked_until).toLocaleString('pt-BR')}.`);
  }

  const normalized = {
    ...payload,
    barbershop_id: user.barbershop_id || user.tenant_id || user.unit_id,
    tenant_id: user.tenant_id || user.barbershop_id || user.unit_id,
    unit_id: user.unit_id || user.barbershop_id || user.tenant_id,
    client_id: user.id
  };

  let response: Response;
  try {
    response = await fetch('/api/appointments/create', withCsrfHeaders({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    }));
  } catch {
    enqueuePendingBooking(normalized);
    throw new Error('Sem conexao. Agendamento salvo localmente e sera reenviado automaticamente.');
  }

  const result = await response.json();
  if (!response.ok || !result?.ok) {
    if (response.status >= 500) {
      enqueuePendingBooking(normalized);
      throw new Error('Instabilidade no servidor. Agendamento salvo localmente para reenvio automatico.');
    }
    throw new Error(result?.reason || result?.error || 'create_appointment_failed');
  }

  return result.appointment;
}

export async function performClientCheckIn(appointmentId: string) {
  const response = await fetch('/api/appointments/check-in', withCsrfHeaders({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointment_id: appointmentId })
  }));
  const result = await response.json();
  if (!response.ok || !result?.ok) {
    throw new Error(result?.reason || result?.error || 'check_in_failed');
  }
  return result.appointment;
}

export async function getAdminAttendanceHistory(limit = 8) {
  const user = await getCurrentUserContext();
  const scopeBarbershopId = String(user.barbershop_id || user.tenant_id || user.unit_id || '');
  const supabase = supabaseClient();
  const now = new Date().toISOString();

  const [completedRes, overdueRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('id,start_datetime,status,check_in_time,check_in_by,service_completed_at,client_id,barber_id,service_id,users(name,email),barbers(users(name)),services(name,price)')
      .eq('barbershop_id', scopeBarbershopId)
      .eq('status', 'completed')
      .order('start_datetime', { ascending: false })
      .limit(limit),
    supabase
      .from('appointments')
      .select('id,start_datetime,status,check_in_time,check_in_by,service_completed_at,client_id,barber_id,service_id,users(name,email),barbers(users(name)),services(name,price)')
      .eq('barbershop_id', scopeBarbershopId)
      .in('status', ['pending', 'confirmed'])
      .is('check_in_time', null)
      .lte('start_datetime', now)
      .order('start_datetime', { ascending: false })
      .limit(limit)
  ]);

  if (completedRes.error) throw completedRes.error;
  if (overdueRes.error) throw overdueRes.error;

  return {
    completed: completedRes.data || [],
    overdueWithoutCheckIn: overdueRes.data || []
  };
}

export async function confirmAppointmentAttendanceByAdmin(appointmentId: string) {
  const response = await fetch('/api/appointments/confirm-service', withCsrfHeaders({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointment_id: appointmentId })
  }));
  const result = await response.json();
  if (!response.ok || !result?.ok) {
    throw new Error(result?.reason || result?.error || 'confirm_service_failed');
  }
  return result.appointment;
}


export function filterAvailabilityBySubscription(slots: Array<{ start: string }>, hasActiveSubscription: boolean, priorityHours = 24) {
  const now = Date.now();
  return slots.filter((slot) => {
    const diffHours = (new Date(slot.start).getTime() - now) / (1000 * 60 * 60);
    if (hasActiveSubscription) return true;
    return diffHours >= priorityHours;
  });
}


export function getRealAvailability(input: {
  slots: Array<{ start: string; end: string }>;
  busy: Array<{ start: string; end: string }>;
  blocked: Array<{ start: string; end: string }>;
  minAdvanceMinutes?: number;
  bufferMinutes?: number;
}) {
  const now = Date.now();
  const minAdvance = Number(input.minAdvanceMinutes || 60) * 60000;
  const buffer = Number(input.bufferMinutes || 0) * 60000;
  const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

  return input.slots.filter((slot) => {
    const s = new Date(slot.start).getTime();
    const e = new Date(slot.end).getTime();
    if (s < now + minAdvance) return false;

    const busyConflict = input.busy.some((b) => overlaps(s, e, new Date(b.start).getTime() - buffer, new Date(b.end).getTime() + buffer));
    const blockedConflict = input.blocked.some((b) => overlaps(s, e, new Date(b.start).getTime(), new Date(b.end).getTime()));
    return !busyConflict && !blockedConflict;
  });
}
