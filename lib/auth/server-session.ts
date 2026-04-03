import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AppSession = {
  userId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'barber' | 'client';
  barbershopId: string | null;
  tenantId: string | null;
};

export async function getAppSession(): Promise<AppSession | null> {
  const supabase = createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;
  const user = authData.user;
  if (!user) return null;

  const [{ data: profileRow }, { data: superAdminRow }] = await Promise.all([
    supabase.from('users').select('id,email,role,barbershop_id,tenant_id').eq('id', user.id).maybeSingle(),
    supabase.from('super_admins').select('id,email').eq('id', user.id).maybeSingle()
  ]);

  if (superAdminRow) {
    return {
      userId: user.id,
      email: superAdminRow.email || user.email || '',
      role: 'super_admin',
      barbershopId: null,
      tenantId: null
    };
  }

  if (!profileRow?.role) return null;
  return {
    userId: user.id,
    email: profileRow.email || user.email || '',
    role: profileRow.role,
    barbershopId: profileRow.barbershop_id || null,
    tenantId: (profileRow as any).tenant_id || profileRow.barbershop_id || null
  };
}

export async function requireAppSession(allowedRoles?: Array<AppSession['role']>) {
  const session = await getAppSession();
  if (!session) redirect('/login');
  if (allowedRoles?.length && !allowedRoles.includes(session.role)) {
    if (allowedRoles.includes('super_admin')) redirect('/superadmin/login');
    redirect('/login');
  }
  return session;
}
