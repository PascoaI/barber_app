'use client';

import { getCurrentUserContext } from '@/lib/auth';
import { supabaseClient } from '@/lib/supabaseClient';

function minutesBetween(start: string, end: string) {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

export async function getAdminKpis() {
  const user = await getCurrentUserContext();
  const supabase = supabaseClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const [subscriptionsRes, plansRes, appointmentsRes] = await Promise.all([
    supabase.from('subscriptions').select('id,plan_id,status,subscription_plans(price,name)').eq('tenant_id', String(user.tenant_id)).eq('unit_id', String(user.unit_id)),
    supabase.from('subscription_plans').select('id,name').eq('unit_id', String(user.unit_id)),
    supabase.from('appointments').select('id,status,start_datetime,end_datetime,barber_id,client_id,service_id,services(price)').eq('tenant_id', String(user.tenant_id)).eq('unit_id', String(user.unit_id)).gte('start_datetime', monthStart).lte('start_datetime', monthEnd)
  ]);
  if (subscriptionsRes.error) throw subscriptionsRes.error;
  if (plansRes.error) throw plansRes.error;
  if (appointmentsRes.error) throw appointmentsRes.error;

  const subscriptions = subscriptionsRes.data || [];
  const activeSubs = subscriptions.filter((s: any) => s.status === 'active');
  const mrr = activeSubs.reduce((acc: number, s: any) => acc + Number(s.subscription_plans?.price || 0), 0);
  const planCounts: Record<string, number> = {};
  subscriptions.forEach((s: any) => {
    const name = s.subscription_plans?.name || 'Sem plano';
    planCounts[name] = (planCounts[name] || 0) + 1;
  });
  const topPlans = Object.entries(planCounts).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

  const appointments = appointmentsRes.data || [];
  const noShows = appointments.filter((a: any) => a.status === 'no_show').length;
  const noShowRate = appointments.length ? (noShows / appointments.length) * 100 : 0;
  const forecast = appointments
    .filter((a: any) => ['pending', 'confirmed', 'awaiting_payment'].includes(a.status) && new Date(a.start_datetime) >= new Date())
    .reduce((acc: number, a: any) => acc + Number(a.services?.price || 0), 0);

  return {
    mrr,
    activeSubscribers: activeSubs.length,
    topPlans,
    noShows,
    noShowRate,
    forecast,
    updatedAt: new Date().toISOString()
  };
}

export async function getOccupancyByBarber() {
  const user = await getCurrentUserContext();
  const supabase = supabaseClient();
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);

  const [barbersRes, apptRes, blockedRes, settingsRes] = await Promise.all([
    supabase.from('barbers').select('id,users(name)').eq('unit_id', String(user.unit_id)),
    supabase.from('appointments').select('id,barber_id,start_datetime,end_datetime,status').eq('tenant_id', String(user.tenant_id)).eq('unit_id', String(user.unit_id)).gte('start_datetime', weekStart.toISOString()).in('status', ['pending', 'confirmed', 'awaiting_payment', 'completed']),
    supabase.from('blocked_slots').select('barber_id,start_datetime,end_datetime').eq('unit_id', String(user.unit_id)).gte('start_datetime', weekStart.toISOString()),
    supabase.from('unit_settings').select('opening_time,closing_time').eq('unit_id', String(user.unit_id)).single()
  ]);
  if (barbersRes.error) throw barbersRes.error;
  if (apptRes.error) throw apptRes.error;
  if (blockedRes.error) throw blockedRes.error;
  if (settingsRes.error) throw settingsRes.error;

  const openMinutes = (() => {
    const [oh, om] = String(settingsRes.data?.opening_time || '09:00').split(':').map(Number);
    const [ch, cm] = String(settingsRes.data?.closing_time || '20:00').split(':').map(Number);
    return Math.max(0, ch * 60 + cm - (oh * 60 + om));
  })();

  const barberRows = (barbersRes.data || []).map((barber: any) => {
    const booked = (apptRes.data || []).filter((a: any) => String(a.barber_id) === String(barber.id)).reduce((acc: number, a: any) => acc + minutesBetween(a.start_datetime, a.end_datetime), 0);
    const blocked = (blockedRes.data || []).filter((b: any) => String(b.barber_id) === String(barber.id)).reduce((acc: number, b: any) => acc + minutesBetween(b.start_datetime, b.end_datetime), 0);
    const days = 7;
    const available = Math.max(1, openMinutes * days - blocked);
    const occupancy = (booked / available) * 100;
    return { barberId: barber.id, barberName: barber.users?.name || `Barbeiro #${barber.id}`, bookedMinutes: booked, availableMinutes: available, occupancy };
  }).sort((a: any, b: any) => b.occupancy - a.occupancy);

  return barberRows;
}

export async function getRetentionReport(daysWithoutBooking = 30) {
  const user = await getCurrentUserContext();
  const supabase = supabaseClient();
  const cutoff = new Date(Date.now() - daysWithoutBooking * 24 * 60 * 60 * 1000).toISOString();

  const { data: clients, error } = await supabase.from('users').select('id,name,email').eq('tenant_id', String(user.tenant_id)).eq('unit_id', String(user.unit_id)).eq('role', 'client');
  if (error) throw error;

  const { data: appointments } = await supabase.from('appointments').select('client_id,start_datetime').eq('tenant_id', String(user.tenant_id)).eq('unit_id', String(user.unit_id)).order('start_datetime', { ascending: false });
  const { data: subscriptions } = await supabase.from('subscriptions').select('user_id,expires_at,status').eq('tenant_id', String(user.tenant_id)).eq('unit_id', String(user.unit_id));

  const staleClients = (clients || []).filter((client: any) => {
    const last = (appointments || []).find((a: any) => String(a.client_id) === String(client.id));
    return !last || new Date(last.start_datetime).toISOString() < cutoff;
  });

  const expiringSubs = (subscriptions || []).filter((s: any) => s.status === 'active' && new Date(s.expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000);

  return { staleClients, expiringSubs };
}


export async function getRecurringNoShowClients(limit = 10) {
  const user = await getCurrentUserContext();
  const supabase = supabaseClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('client_id,status,users(name,email)')
    .eq('tenant_id', String(user.tenant_id))
    .eq('unit_id', String(user.unit_id))
    .eq('status', 'no_show');
  if (error) throw error;
  const grouped: Record<string, { client_id: string; total: number; name?: string; email?: string }> = {};
  (data || []).forEach((row: any) => {
    const key = String(row.client_id);
    grouped[key] = grouped[key] || { client_id: key, total: 0, name: row.users?.name, email: row.users?.email };
    grouped[key].total += 1;
  });
  return Object.values(grouped).sort((a, b) => b.total - a.total).slice(0, limit);
}

export async function blockClientUntil(clientId: string, blockedUntil: string) {
  const supabase = supabaseClient();
  const { error } = await supabase.from('users').update({ blocked_until: blockedUntil }).eq('id', clientId);
  if (error) throw error;
}


export async function unblockClient(clientId: string) {
  const supabase = supabaseClient();
  const { error } = await supabase.from('users').update({ blocked_until: null }).eq('id', clientId);
  if (error) throw error;
}
