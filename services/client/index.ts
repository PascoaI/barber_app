import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export async function loadClientProfile(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('users').select('id,name,email,phone').eq('id', userId).single();
  if (error) throw error;
  return data;
}
