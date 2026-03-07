import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type MiddlewareSession = {
  role: 'super_admin' | 'admin' | 'barber' | 'client';
  barbershopId: string | null;
};

function getSupabaseMiddlewareEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) {
    throw new Error('Missing Supabase env for middleware auth.');
  }
  return { url, anonKey };
}

export async function getMiddlewareSession(req: NextRequest) {
  const { url, anonKey } = getSupabaseMiddlewareEnv();
  const res = NextResponse.next();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      }
    }
  });

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return { res, session: null as MiddlewareSession | null };

  const [{ data: profileRow }, { data: superAdminRow }] = await Promise.all([
    supabase.from('users').select('role,barbershop_id').eq('id', user.id).maybeSingle(),
    supabase.from('super_admins').select('id').eq('id', user.id).maybeSingle()
  ]);

  if (superAdminRow?.id) {
    return {
      res,
      session: {
        role: 'super_admin',
        barbershopId: null
      }
    };
  }

  if (!profileRow?.role) return { res, session: null as MiddlewareSession | null };
  return {
    res,
    session: {
      role: profileRow.role,
      barbershopId: profileRow.barbershop_id || null
    }
  };
}
