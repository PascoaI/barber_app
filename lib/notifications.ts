'use client';

import { getCurrentUserContext } from '@/lib/auth';
import { supabaseClient } from '@/lib/supabaseClient';

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
