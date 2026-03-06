import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export async function listBookingServices() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('services').select('id,name,duration_minutes,price').order('name');
  if (error) throw error;
  return data || [];
}
