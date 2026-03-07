import { createSupabaseServerClient } from '@/lib/supabase/server';

type SessionProfile = {
  id: string;
  email?: string;
  role?: string;
  barbershop_id?: string | null;
  tenant_id?: string | null;
  unit_id?: string | null;
  blocked_until?: string | null;
};

export async function getOptionalSessionProfile(_req?: Request): Promise<SessionProfile | null> {
  const supabase = createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id,email,role,barbershop_id')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileError) throw profileError;

  if (!profile) {
    return {
      id: authData.user.id,
      email: authData.user.email || '',
      role: 'client',
      barbershop_id: null,
      tenant_id: null,
      unit_id: null,
      blocked_until: null
    };
  }

  const barbershopId = (profile as any).barbershop_id || null;
  return {
    id: profile.id,
    email: profile.email || authData.user.email || '',
    role: (profile as any).role || 'client',
    barbershop_id: barbershopId,
    tenant_id: barbershopId,
    unit_id: barbershopId,
    blocked_until: (profile as any).blocked_until || null
  };
}
