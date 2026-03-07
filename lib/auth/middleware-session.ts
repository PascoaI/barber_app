import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type MiddlewareSession = {
  role: 'super_admin' | 'admin' | 'barber' | 'client';
  barbershopId: string | null;
};

function getSupabaseMiddlewareEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export async function getMiddlewareSession(req: NextRequest) {
  const res = NextResponse.next();
  const cfg = getSupabaseMiddlewareEnv();

  if (!cfg) {
    return {
      res,
      session: null as MiddlewareSession | null,
      authAvailable: false,
      reason: 'missing_supabase_env'
    };
  }

  try {
    const supabase = createServerClient(cfg.url, cfg.anonKey, {
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
    if (!user) {
      return {
        res,
        session: null as MiddlewareSession | null,
        authAvailable: true
      };
    }

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
        },
        authAvailable: true
      };
    }

    if (!profileRow?.role) {
      return {
        res,
        session: null as MiddlewareSession | null,
        authAvailable: true
      };
    }

    return {
      res,
      session: {
        role: profileRow.role,
        barbershopId: profileRow.barbershop_id || null
      },
      authAvailable: true
    };
  } catch {
    return {
      res,
      session: null as MiddlewareSession | null,
      authAvailable: false,
      reason: 'middleware_auth_error'
    };
  }
}
