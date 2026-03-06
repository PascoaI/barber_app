'use client';

import { supabaseClient } from '@/lib/supabaseClient';

export type UserContext = {
  id: string;
  email?: string;
  role?: string;
  tenant_id?: string | number;
  unit_id?: string | number;
  blocked_until?: string | null;
};

export async function getCurrentUserContext(): Promise<UserContext> {
  const supabase = supabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const authUser = authData.user;
  if (!authUser) throw new Error('Usuário não autenticado.');

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, role, tenant_id, unit_id, blocked_until')
    .eq('id', authUser.id)
    .single();

  if (profileError) throw profileError;
  return {
    id: profile?.id ?? authUser.id,
    email: profile?.email ?? authUser.email,
    role: profile?.role,
    tenant_id: profile?.tenant_id,
    unit_id: profile?.unit_id,
    blocked_until: profile?.blocked_until ?? null
  };
}
