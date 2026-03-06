'use client';

import { getCurrentUserContext } from '@/lib/auth';
import { supabaseClient } from '@/lib/supabaseClient';

export async function getClientSubscriptionPanel() {
  const user = await getCurrentUserContext();
  const supabase = supabaseClient();

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('id,user_id,plan_id,remaining_sessions,expires_at,status,created_at,addon_sessions,paused_until,subscription_plans(name,price,sessions_per_month,max_members)')
.eq('user_id', String(user.id))
    .eq('tenant_id', String(user.tenant_id))
    .eq('unit_id', String(user.unit_id))
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && !String(error.message || '').includes('0 rows')) throw error;
  if (!subscription) return null;

  const sessionsPerMonth = Number(subscription.subscription_plans?.sessions_per_month || 0) + Number(subscription.addon_sessions || 0);
  const used = Math.max(0, sessionsPerMonth - Number(subscription.remaining_sessions || 0));

  const { data: usage } = await supabase
    .from('subscription_usage')
    .select('id,appointment_id,sessions_used,service_price,used_at')
    .eq('subscription_id', String(subscription.id))
    .order('used_at', { ascending: false });

  const monthlySavings = (usage || [])
    .filter((u: any) => new Date(u.used_at).getMonth() === new Date().getMonth())
    .reduce((acc: number, u: any) => acc + Number(u.service_price || 0), 0) - Number(subscription.subscription_plans?.price || 0);

  return {
    subscription,
    usage: usage || [],
    sessionsPerMonth,
    used,
    monthlySavings
  };
}

export async function pauseSubscription30Days(subscriptionId: string) {
  const supabase = supabaseClient();
  const pausedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('subscriptions').update({ status: 'paused', paused_until: pausedUntil }).eq('id', subscriptionId);
  if (error) throw error;
}

export async function cancelSubscription(subscriptionId: string) {
  const supabase = supabaseClient();
  const { error } = await supabase.from('subscriptions').update({ status: 'canceled' }).eq('id', subscriptionId);
  if (error) throw error;
}

export async function buyAddonSessions(subscriptionId: string, amount = 2) {
  const supabase = supabaseClient();
  const { data: current, error: fetchError } = await supabase.from('subscriptions').select('id,addon_sessions,remaining_sessions').eq('id', subscriptionId).single();
  if (fetchError) throw fetchError;
  const { error } = await supabase.from('subscriptions').update({ addon_sessions: Number(current?.addon_sessions || 0) + amount, remaining_sessions: Number(current?.remaining_sessions || 0) + amount }).eq('id', subscriptionId);
  if (error) throw error;
}

export async function applySubscriptionUsageOnCompleted(appointmentId: string) {
  const supabase = supabaseClient();
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('id,client_id,service_id,status,tenant_id,unit_id,services(price)')
    .eq('id', appointmentId)
    .single();
  if (appointmentError) throw appointmentError;
  if (appointment?.status !== 'completed') return;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id,remaining_sessions,status')
    .eq('user_id', String(appointment.client_id))
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subscription && canConsumeSubscriptionSessions(subscription.status) && Number(subscription.remaining_sessions || 0) > 0) {
    await supabase.from('subscriptions').update({ remaining_sessions: Number(subscription.remaining_sessions) - 1 }).eq('id', String(subscription.id));
    await supabase.from('subscription_usage').insert({
      subscription_id: subscription.id,
      appointment_id: appointment.id,
      sessions_used: 1,
      service_price: appointment?.services?.price || 0,
      used_at: new Date().toISOString()
    }).execute();
  }
}


export async function upsertFamilyPlan(input: { id?: string; unit_id: string; name: string; price: number; sessions_per_month: number; max_members: number }) {
  const supabase = supabaseClient();
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    unit_id: input.unit_id,
    name: input.name,
    price: input.price,
    sessions_per_month: input.sessions_per_month,
    max_members: input.max_members
  };
  const { error } = await supabase.from('subscription_plans').upsert(payload, { onConflict: 'id' }).execute();
  if (error) throw error;
}

export async function listFamilyPlans(unitId: string) {
  const supabase = supabaseClient();
  const { data, error } = await supabase.from('subscription_plans').select('id,name,price,sessions_per_month,max_members').eq('unit_id', unitId).gte('max_members', '2');
  if (error) throw error;
  return data || [];
}

export async function applyTenureBenefits(subscriptionId: string) {
  const supabase = supabaseClient();
  const { data: sub, error } = await supabase.from('subscriptions').select('id,created_at,user_id,status').eq('id', subscriptionId).single();
  if (error || !sub || sub.status !== 'active') return;
  const months = Math.floor((Date.now() - new Date(sub.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000));
  if (months >= 3) {
    await supabase.from('subscription_rewards').insert({ subscription_id: sub.id, user_id: sub.user_id, reward_type: months >= 6 ? 'temporary_upgrade' : 'bonus_session', granted_at: new Date().toISOString() }).execute();
  }
}


export function canConsumeSubscriptionSessions(status: string | undefined | null) {
  return status === 'active';
}
