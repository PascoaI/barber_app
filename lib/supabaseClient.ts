'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export function supabaseClient() {
  return getSupabaseBrowserClient();
}
