import { createSupabaseServerClient } from '@/lib/supabase/server';

export type RouteAppSession = {
  userId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'barber' | 'client';
  barbershopId: string | null;
  tenantId: string | null;
};

export async function getRouteAppSession(): Promise<RouteAppSession | null> {
  const supabase = createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const [{ data: profile }, { data: superAdmin }] = await Promise.all([
    supabase.from('users').select('id,email,role,barbershop_id,tenant_id').eq('id', authData.user.id).maybeSingle(),
    supabase.from('super_admins').select('id').eq('id', authData.user.id).maybeSingle()
  ]);

  if (superAdmin?.id) {
    return {
      userId: authData.user.id,
      email: authData.user.email || '',
      role: 'super_admin',
      barbershopId: null,
      tenantId: null
    };
  }

  if (!profile?.role) return null;
  return {
    userId: authData.user.id,
    email: profile.email || authData.user.email || '',
    role: profile.role,
    barbershopId: profile.barbershop_id || null,
    tenantId: (profile as any).tenant_id || profile.barbershop_id || null
  };
}
