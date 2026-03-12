'use client';

import { getCurrentUserContext } from '@/lib/auth';
import { createAppointmentSafe } from '@/lib/appointments';
import { withCsrfHeaders } from '@/lib/security/csrf-client';
import { supabaseClient } from '@/lib/supabaseClient';

type BusyInterval = { start: Date; end: Date };

export type BookingSetup = {
  barbershopName: string;
  barbers: Array<{ id: string; name: string }>;
};

export type BookingService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
};

export type BookingSlot = {
  start: string;
  end: string;
  label: string;
};

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toDateOrNull(value: unknown) {
  const parsed = new Date(String(value || ''));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function intersects(a: BusyInterval, b: BusyInterval) {
  return a.start < b.end && b.start < a.end;
}

function asDateInput(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDateInput() {
  return asDateInput(new Date());
}

export function combineDateAndTime(dateInput: string, timeInput: string) {
  const parsed = new Date(`${dateInput}T${timeInput}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export async function getBookingSetup(): Promise<BookingSetup> {
  const user = await getCurrentUserContext();
  const scopeBarbershopId = String(user.barbershop_id || user.tenant_id || user.unit_id || '');
  const supabase = supabaseClient();

  const [barbershopRes, barbersRes] = await Promise.all([
    supabase.from('barbershops').select('name').eq('id', scopeBarbershopId).maybeSingle(),
    supabase.from('barbers').select('*').eq('barbershop_id', scopeBarbershopId).eq('active', true)
  ]);

  if (barbershopRes.error) throw barbershopRes.error;
  if (barbersRes.error) throw barbersRes.error;

  const barbers = (barbersRes.data || [])
    .map((row: any) => ({
      id: String(row.id),
      name: String(row.name || row.users?.name || row.users?.email || 'Profissional')
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return {
    barbershopName: String((barbershopRes.data as any)?.name || 'Sua barbearia'),
    barbers
  };
}

export async function getBookingServices() {
  const user = await getCurrentUserContext();
  const scopeBarbershopId = String(user.barbershop_id || user.tenant_id || user.unit_id || '');
  const supabase = supabaseClient();

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('barbershop_id', scopeBarbershopId)
    .eq('active', true);

  if (error) throw error;

  return (data || [])
    .map((row: any) => ({
      id: String(row.id),
      name: String(row.name || 'Servico'),
      description: String(row.description || ''),
      durationMinutes: toNumber(row.duration_minutes, 30),
      price: toNumber(row.price, 0)
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')) as BookingService[];
}

export async function getAvailableSlots(params: {
  barberId: string;
  serviceDurationMinutes: number;
  dateInput: string;
  editingAppointmentId?: string;
}) {
  const user = await getCurrentUserContext();
  const scopeBarbershopId = String(user.barbershop_id || user.tenant_id || user.unit_id || '');
  const supabase = supabaseClient();
  const serviceDuration = Math.max(5, Number(params.serviceDurationMinutes || 30));
  const dayStart = new Date(`${params.dateInput}T00:00:00`);
  const dayEnd = new Date(`${params.dateInput}T23:59:59`);

  if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) return [];

  const [settingsRes, appointmentsRes, blockedRes] = await Promise.all([
    supabase.from('unit_settings').select('*').eq('barbershop_id', scopeBarbershopId).limit(1).maybeSingle(),
    supabase
      .from('appointments')
      .select('*')
      .eq('barbershop_id', scopeBarbershopId)
      .eq('barber_id', params.barberId)
      .gte('start_datetime', dayStart.toISOString())
      .lte('start_datetime', dayEnd.toISOString())
      .in('status', ['awaiting_payment', 'pending', 'confirmed']),
    supabase
      .from('blocked_slots')
      .select('*')
      .eq('barbershop_id', scopeBarbershopId)
      .eq('barber_id', params.barberId)
  ]);

  if (settingsRes.error) throw settingsRes.error;
  if (appointmentsRes.error) throw appointmentsRes.error;
  if (blockedRes.error) throw blockedRes.error;

  const settings = (settingsRes.data || {}) as any;
  const opening = String(settings.opening_time || '09:00');
  const closing = String(settings.closing_time || '20:00');
  const intervalMinutes = Math.max(5, toNumber(settings.slot_interval_minutes, 30));
  const bufferMinutes = Math.max(0, toNumber(settings.buffer_between_appointments_minutes, 0));
  const minAdvanceMinutes = Math.max(0, toNumber(settings.min_advance_minutes, 60));

  const [openH, openM] = opening.split(':').map((part) => Number(part));
  const [closeH, closeM] = closing.split(':').map((part) => Number(part));
  const openAt = new Date(dayStart);
  const closeAt = new Date(dayStart);
  openAt.setHours(Number.isFinite(openH) ? openH : 9, Number.isFinite(openM) ? openM : 0, 0, 0);
  closeAt.setHours(Number.isFinite(closeH) ? closeH : 20, Number.isFinite(closeM) ? closeM : 0, 0, 0);

  const busyIntervals: BusyInterval[] = [];
  (appointmentsRes.data || []).forEach((row: any) => {
    if (params.editingAppointmentId && String(row.id) === String(params.editingAppointmentId)) return;
    const start = toDateOrNull(row.start_datetime || row.appointment_date);
    const end = toDateOrNull(row.end_datetime);
    if (!start || !end || end <= start) return;
    busyIntervals.push({
      start: new Date(start.getTime() - bufferMinutes * 60000),
      end: new Date(end.getTime() + bufferMinutes * 60000)
    });
  });

  const blockedIntervals: BusyInterval[] = [];
  (blockedRes.data || []).forEach((row: any) => {
    const start = toDateOrNull(row.start_datetime || row.start_time);
    const end = toDateOrNull(row.end_datetime || row.end_time);
    if (!start || !end || end <= start) return;
    blockedIntervals.push({ start, end });
  });

  const now = Date.now();
  const slots: BookingSlot[] = [];
  for (let cursor = new Date(openAt); cursor < closeAt; cursor = new Date(cursor.getTime() + intervalMinutes * 60000)) {
    const end = new Date(cursor.getTime() + serviceDuration * 60000);
    if (end > closeAt) continue;
    if (cursor.getTime() < now + minAdvanceMinutes * 60000) continue;

    const interval = { start: cursor, end };
    const hasBusyConflict = busyIntervals.some((busy) => intersects(interval, busy));
    const hasBlockedConflict = blockedIntervals.some((blocked) => intersects(interval, blocked));
    if (hasBusyConflict || hasBlockedConflict) continue;

    slots.push({
      start: cursor.toISOString(),
      end: end.toISOString(),
      label: cursor.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
  }

  return slots;
}

export async function createBookingAppointment(input: {
  barberId: string;
  serviceId: string;
  startIso: string;
  endIso: string;
}) {
  const idempotencyKey = `idem:${input.serviceId}:${input.barberId}:${input.startIso}:${Date.now()}`;
  return createAppointmentSafe({
    idempotency_key: idempotencyKey,
    barber_id: input.barberId,
    service_id: input.serviceId,
    start_datetime: input.startIso,
    end_datetime: input.endIso,
    status: 'pending'
  });
}

export async function rescheduleAppointment(input: {
  appointmentId: string;
  startIso: string;
  endIso: string;
}) {
  const response = await fetch(`/api/appointments/${input.appointmentId}`, withCsrfHeaders({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start_datetime: input.startIso, end_datetime: input.endIso })
  }));
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok) throw new Error(result?.error || result?.reason || 'reschedule_failed');
  return result.appointment;
}

export async function cancelAppointment(appointmentId: string) {
  const response = await fetch(`/api/appointments/${appointmentId}`, withCsrfHeaders({
    method: 'DELETE'
  }));
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok) throw new Error(result?.error || result?.reason || 'cancel_failed');
  return result.appointment;
}
