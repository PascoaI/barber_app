'use client';

import { supabaseClient } from '@/lib/supabaseClient';

export async function createNotification(payload: { user_id: string; type: string; scheduled_for?: string; metadata?: Record<string, unknown> }) {
  const supabase = supabaseClient();
  const { error } = await supabase.from('notifications').insert({
    user_id: payload.user_id,
    type: payload.type,
    status: 'pending',
    scheduled_for: payload.scheduled_for || new Date().toISOString(),
    metadata: payload.metadata || {}
  }).execute();
  if (error) throw error;
}
