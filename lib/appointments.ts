'use client';

import { getCurrentUserContext } from '@/lib/auth';
import { supabaseClient } from '@/lib/supabaseClient';

const UPCOMING_STATUSES = ['pending', 'confirmed', 'awaiting_payment'];

export async function getNextAppointment() {
  const user = await getCurrentUserContext();
  const supabase = supabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('appointments')
    .select('id, start_datetime, end_datetime, status, service_id, barber_id, services(name,price), barbers(users(name))')
    .eq('tenant_id', String(user.tenant_id))
    .eq('unit_id', String(user.unit_id))
    .eq('client_id', String(user.id))
    .in('status', UPCOMING_STATUSES)
    .gte('start_datetime', now)
    .order('start_datetime', { ascending: true })
    .limit(1)
    .single();

  if (error && !String(error.message || '').includes('0 rows')) throw error;
  return data || null;
}

export async function getLastCompletedAppointment() {
  const user = await getCurrentUserContext();
  const supabase = supabaseClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('id, service_id, barber_id, start_datetime')
    .eq('tenant_id', String(user.tenant_id))
    .eq('unit_id', String(user.unit_id))
    .eq('client_id', String(user.id))
    .eq('status', 'completed')
    .order('start_datetime', { ascending: false })
    .limit(1)
    .single();
  if (error && !String(error.message || '').includes('0 rows')) throw error;
  return data || null;
}

export function buildRepeatLastCutUrl(data: { service_id?: string; barber_id?: string } | null) {
  if (!data?.service_id) return null;
  const params = new URLSearchParams();
  params.set('service_id', String(data.service_id));
  if (data.barber_id) params.set('barber_id', String(data.barber_id));
  return `/booking-datetime?${params.toString()}`;
}

export async function listClientHistory(filters: {
  status?: string;
  barber_id?: string;
  from?: string;
  to?: string;
}) {
  const user = await getCurrentUserContext();
  const supabase = supabaseClient();
  let query = supabase
    .from('appointments')
    .select('id,start_datetime,end_datetime,status,barber_id,service_id,barbers(users(name)),services(name,price)')
    .eq('tenant_id', String(user.tenant_id))
    .eq('unit_id', String(user.unit_id))
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
  const supabase = supabaseClient();
  if (user.blocked_until && new Date(user.blocked_until) > new Date()) {
    throw new Error(`Cliente bloqueado para agendamento até ${new Date(user.blocked_until).toLocaleString('pt-BR')}.`);
  }

  const normalized = {
    ...payload,
    tenant_id: user.tenant_id,
    unit_id: user.unit_id,
    client_id: user.id
  };

  const { data, error } = await supabase.from('appointments').insert(normalized).select('*').single();
  if (error) throw error;
  return data;
}


export function filterAvailabilityBySubscription(slots: Array<{ start: string }>, hasActiveSubscription: boolean, priorityHours = 24) {
  const now = Date.now();
  return slots.filter((slot) => {
    const diffHours = (new Date(slot.start).getTime() - now) / (1000 * 60 * 60);
    if (hasActiveSubscription) return true;
    return diffHours >= priorityHours;
  });
}
