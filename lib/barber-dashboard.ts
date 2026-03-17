'use client';

import { getCurrentUserContext } from '@/lib/auth';
import { supabaseClient } from '@/lib/supabaseClient';
import { withCsrfHeaders } from '@/lib/security/csrf-client';

export type BarberAppointmentRow = {
  id: string;
  start_datetime: string;
  end_datetime?: string | null;
  created_at?: string | null;
  status: string;
  barber_id: string;
  client_id?: string | null;
  service_id?: string | null;
  status_reason?: string | null;
  notes?: string | null;
  service_price?: number | null;
  service_name?: string | null;
  delay_minutes?: number | null;
  delay_reason?: string | null;
  transferred_from_barber_id?: string | null;
  transferred_to_barber_id?: string | null;
  rescheduled_from?: string | null;
  rescheduled_by?: string | null;
  client_name?: string | null;
  users?: { name?: string | null; email?: string | null } | null;
  services?: { name?: string | null; price?: number | null; duration_minutes?: number | null } | null;
  barbers?: { users?: { name?: string | null } | null } | null;
  _displayClient?: string;
  _displayService?: string;
  _displayPrice?: number;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const dayStart = startOfDay(date);
  const day = dayStart.getDay();
  const diffToMonday = (day + 6) % 7;
  dayStart.setDate(dayStart.getDate() - diffToMonday);
  return dayStart;
}

function resolveServicePrice(row: BarberAppointmentRow) {
  const value = Number(row.service_price ?? row.services?.price ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function isCompleted(status: string) {
  return String(status || '').toLowerCase() === 'completed';
}

function resolveDisplayClient(row: BarberAppointmentRow) {
  return row.client_name || row.users?.name || row.users?.email || '-';
}

function resolveDisplayService(row: BarberAppointmentRow) {
  return row.service_name || row.services?.name || 'Servico';
}

async function resolveCurrentBarberId() {
  const user = await getCurrentUserContext();
  const scopeBarbershopId = String(user.barbershop_id || user.tenant_id || user.unit_id || '');
  const supabase = supabaseClient();

  const { data: barbers, error } = await supabase
    .from('barbers')
    .select('id,name,users(id,email)')
    .eq('barbershop_id', scopeBarbershopId)
    .eq('active', true);
  if (error) throw error;

  const rows = (barbers || []) as any[];
  const byId = rows.find((row) => String(row.id) === String(user.id));
  const byUser = rows.find((row) => String(row.users?.id || '') === String(user.id));
  const byEmail = rows.find((row) => String(row.users?.email || '').toLowerCase() === String(user.email || '').toLowerCase());
  const fallback = rows.length === 1 ? rows[0] : null;
  const barberRow = byId || byUser || byEmail || fallback;
  if (!barberRow?.id) {
    throw new Error('Barbeiro nao encontrado para o usuario logado.');
  }

  return {
    barberId: String(barberRow.id),
    barbershopId: scopeBarbershopId,
    userRole: String(user.role || ''),
    barberOptions: rows.map((row: any) => ({ id: String(row.id), name: String(row.name || row.users?.name || `Barbeiro ${row.id}`) }))
  };
}

export async function getBarberDashboardData() {
  const { barberId, barbershopId, barberOptions } = await resolveCurrentBarberId();
  const supabase = supabaseClient();

  const { data, error } = await supabase
    .from('appointments')
    .select('id,start_datetime,end_datetime,created_at,status,status_reason,notes,barber_id,client_id,service_id,service_price,service_name,client_name,delay_minutes,delay_reason,transferred_from_barber_id,transferred_to_barber_id,rescheduled_from,rescheduled_by,users(name,email),services(name,price,duration_minutes),barbers(users(name))')
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .order('start_datetime', { ascending: true })
    .limit(80);

  if (error) throw error;

  const rows = (data || []) as BarberAppointmentRow[];
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const completed = rows.filter((row) => isCompleted(row.status));
  const earningsToday = completed
    .filter((row) => {
      const at = new Date(row.start_datetime);
      return at >= dayStart && at < dayEnd;
    })
    .reduce((sum, row) => sum + resolveServicePrice(row), 0);
  const earningsWeek = completed
    .filter((row) => {
      const at = new Date(row.start_datetime);
      return at >= weekStart && at < weekEnd;
    })
    .reduce((sum, row) => sum + resolveServicePrice(row), 0);

  const normalizedRows = rows.map((row) => ({
    ...row,
    _displayClient: resolveDisplayClient(row),
    _displayService: resolveDisplayService(row),
    _displayPrice: resolveServicePrice(row)
  }));

  return {
    barberId,
    barberOptions,
    appointments: normalizedRows,
    earningsToday,
    earningsWeek
  };
}

export async function concludeBarberService(appointmentId: string) {
  const response = await fetch('/api/appointments/confirm-service', withCsrfHeaders({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointment_id: appointmentId })
  }));
  const result = await response.json();
  if (!response.ok || !result?.ok) {
    throw new Error(result?.reason || result?.error || 'conclude_service_failed');
  }
  return result.appointment;
}

async function patchBarberAppointment(appointmentId: string, payload: Record<string, any>) {
  const response = await fetch(`/api/barber/appointments/${encodeURIComponent(appointmentId)}`, withCsrfHeaders({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }));
  const result = await response.json();
  if (!response.ok || !result?.ok) {
    throw new Error(result?.reason || result?.error || 'barber_appointment_patch_failed');
  }
  return result.appointment;
}

export async function updateBarberAppointmentStatus(input: {
  appointmentId: string;
  toStatus: 'in_progress' | 'completed' | 'no_show' | 'canceled';
  reason?: string;
}) {
  return patchBarberAppointment(input.appointmentId, {
    action: 'status',
    to_status: input.toStatus,
    reason: input.reason || undefined
  });
}

export async function signalBarberAppointmentDelay(input: {
  appointmentId: string;
  delayMinutes: number;
  delayReason?: string;
}) {
  return patchBarberAppointment(input.appointmentId, {
    action: 'delay',
    delay_minutes: input.delayMinutes,
    delay_reason: input.delayReason || undefined
  });
}

export async function rescheduleBarberAppointment(input: {
  appointmentId: string;
  startIso: string;
  endIso?: string;
  durationMinutes?: number;
}) {
  return patchBarberAppointment(input.appointmentId, {
    action: 'reschedule',
    start_datetime: input.startIso,
    end_datetime: input.endIso,
    duration_minutes: input.durationMinutes
  });
}

export async function transferBarberAppointment(input: {
  appointmentId: string;
  toBarberId: string;
  startIso?: string;
  endIso?: string;
}) {
  return patchBarberAppointment(input.appointmentId, {
    action: 'transfer',
    to_barber_id: input.toBarberId,
    start_datetime: input.startIso,
    end_datetime: input.endIso
  });
}

export async function getBarberAppointmentClientContext(appointmentId: string) {
  const response = await fetch(`/api/barber/appointments/${encodeURIComponent(appointmentId)}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  const result = await response.json();
  if (!response.ok || !result?.ok) {
    throw new Error(result?.reason || result?.error || 'barber_appointment_context_failed');
  }
  return result.context;
}

export function getOperationalStatusLabel(status: string) {
  const key = String(status || '').toLowerCase();
  if (['awaiting_payment', 'pending', 'confirmed'].includes(key)) return 'AGENDADO';
  if (key === 'in_progress') return 'EM_ANDAMENTO';
  if (key === 'completed') return 'CONCLUIDO';
  if (key === 'no_show') return 'NÃO COMPARECEU';
  if (key === 'canceled' || key === 'cancelled') return 'CANCELADO';
  return String(status || '').toUpperCase();
}

