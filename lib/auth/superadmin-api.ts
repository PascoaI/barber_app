import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';

export async function getAuthenticatedUserOrNull() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function assertSuperAdminSession() {
  const supabase = createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return { ok: false as const, status: 401, message: 'Nao autenticado.' };

  const { data: superAdminRow, error: superAdminError } = await supabase
    .from('super_admins')
    .select('id,email')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (superAdminError) throw superAdminError;
  if (!superAdminRow?.id) return { ok: false as const, status: 403, message: 'Acesso exclusivo do SuperAdmin.' };

  return {
    ok: true as const,
    user: authData.user,
    superAdmin: superAdminRow
  };
}

export function getServiceClientForPrivilegedOps() {
  return createSupabaseServiceClient();
}
