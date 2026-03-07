'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient<any> | null = null;

function getBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase nao configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return { url, anonKey };
}

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const { url, anonKey } = getBrowserEnv();
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
