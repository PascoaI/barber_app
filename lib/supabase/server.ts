import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
}

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function assertPublicEnv() {
  const url = getSupabaseUrl();
  const anonKey = getAnonKey();
  if (!url || !anonKey) {
    throw new Error('Missing Supabase public env. Configure SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return { url, anonKey };
}

export function createSupabaseServerClient() {
  const { url, anonKey } = assertPublicEnv();
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components may not mutate cookies in this context.
        }
      }
    }
  });
}

export function createSupabaseServiceClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for privileged server operations.');
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
