import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Barbershop, BarbershopInput } from '@/types/barbershop';

const TABLE = 'barbershops';

export async function listBarbershops() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Barbershop[];
}

export async function createBarbershop(input: BarbershopInput) {
  const supabase = getSupabaseBrowserClient();
  const payload = {
    ...input,
    status: input.status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from(TABLE).insert(payload);
  if (error) throw error;
}

export async function updateBarbershop(id: string, patch: Partial<BarbershopInput>) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from(TABLE).update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function disableBarbershop(id: string) {
  return updateBarbershop(id, { status: 'disabled' });
}

export async function deleteBarbershop(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from(TABLE).update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
