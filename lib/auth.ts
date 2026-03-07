'use client';

import { supabaseClient } from '@/lib/supabaseClient';

export type UserContext = {
  id: string;
  email?: string;
  role?: string;
  barbershop_id?: string | null;
  tenant_id?: string | null;
  unit_id?: string | null;
  blocked_until?: string | null;
};

export async function getCurrentUserContext(): Promise<UserContext> {
  const supabase = supabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const authUser = authData.user;
  if (!authUser) throw new Error('Usuario nao autenticado.');

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id,email,role,barbershop_id')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError) throw profileError;

  const barbershopId = (profile as any)?.barbershop_id ?? null;
  return {
    id: profile?.id ?? authUser.id,
    email: profile?.email ?? authUser.email ?? '',
    role: (profile as any)?.role ?? 'client',
    barbershop_id: barbershopId,
    tenant_id: barbershopId,
    unit_id: barbershopId,
    blocked_until: (profile as any)?.blocked_until ?? null
  };
}
