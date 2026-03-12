'use client';

import { getCurrentUserContext } from '@/lib/auth';
import { supabaseClient } from '@/lib/supabaseClient';

export type ClientNotificationItem = {
  id: string;
  type: string;
  status: string;
  message: string;
  createdAt: string | null;
  sentAt: string | null;
};

export async function createNotification(payload: { user_id: string; type: string; scheduled_for?: string; metadata?: Record<string, unknown> }) {
  const user = await getCurrentUserContext();
  const scopeBarbershopId = String(user.barbershop_id || user.tenant_id || user.unit_id || '');
  const supabase = supabaseClient();
  const { error } = await supabase.from('notifications').insert({
    barbershop_id: scopeBarbershopId,
    user_id: payload.user_id,
    type: payload.type,
    status: 'pending',
    scheduled_for: payload.scheduled_for || new Date().toISOString(),
    metadata: payload.metadata || {}
  });
  if (error) throw error;
}

export async function listClientNotifications() {
  const user = await getCurrentUserContext();
  const scopeBarbershopId = String(user.barbershop_id || user.tenant_id || user.unit_id || '');
  const supabase = supabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('barbershop_id', scopeBarbershopId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || [])
    .filter((row: any) => String(row.user_id || row.client_id || '') === String(user.id))
    .map((row: any) => ({
      id: String(row.id),
      type: String(row.type || 'general'),
      status: String(row.status || 'pending'),
      message: String(row.message || row.metadata?.message || ''),
      createdAt: row.created_at || null,
      sentAt: row.sent_at || null
    })) as ClientNotificationItem[];
}

export async function markClientNotificationAsRead(notificationId: string) {
  const user = await getCurrentUserContext();
  const scopeBarbershopId = String(user.barbershop_id || user.tenant_id || user.unit_id || '');
  const supabase = supabaseClient();

  const { error } = await supabase
    .from('notifications')
    .update({ status: 'read' })
    .eq('id', notificationId)
    .eq('barbershop_id', scopeBarbershopId);

  if (error) throw error;
}
