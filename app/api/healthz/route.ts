import { NextResponse } from 'next/server';

function hasRequiredSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return Boolean(url && anon);
}

export async function GET() {
  const ok = hasRequiredSupabaseEnv();
  return NextResponse.json(
    {
      status: ok ? 'ok' : 'degraded',
      uptime_seconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        middleware_auth_env: ok ? 'ok' : 'missing'
      }
    },
    {
      status: ok ? 200 : 503
    }
  );
}
