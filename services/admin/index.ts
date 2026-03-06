import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export async function listAdminBarbers(unitId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('barbers').select('*').eq('unit_id', unitId).order('name');
  if (error) throw error;
  return data || [];
}
