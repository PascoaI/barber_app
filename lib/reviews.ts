'use client';

import { getCurrentUserContext } from '@/lib/auth';
import { supabaseClient } from '@/lib/supabaseClient';

export async function submitAppointmentReview(input: { appointment_id: string; rating: number; comment?: string }) {
  const user = await getCurrentUserContext();
  const supabase = supabaseClient();

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('id,client_id,status,tenant_id,unit_id')
    .eq('id', input.appointment_id)
    .single();

  if (appointmentError) throw appointmentError;
  if (String(appointment?.client_id) !== String(user.id)) throw new Error('Você só pode avaliar seus próprios atendimentos.');
  if (appointment?.status !== 'completed') throw new Error('Só é possível avaliar atendimentos concluídos.');

  const { data: existing } = await supabase.from('reviews').select('id').eq('appointment_id', input.appointment_id).single();
  if (existing?.id) throw new Error('Este atendimento já foi avaliado.');

  const { error } = await supabase.from('reviews').insert({
    appointment_id: input.appointment_id,
    rating: input.rating,
    comment: input.comment || null,
    tenant_id: appointment.tenant_id,
    unit_id: appointment.unit_id,
    user_id: user.id
  }).execute();
  if (error) throw error;
}
