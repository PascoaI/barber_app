import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

type SessionProfile = {
  id: string;
  email?: string;
  role?: string;
  tenant_id?: string | number | null;
  unit_id?: string | number | null;
  blocked_until?: string | null;
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
};

function getBearerToken(req: Request) {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

async function fetchSupabaseAuthUser(accessToken: string): Promise<SupabaseAuthUser | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = publicAnonKey || serviceKey;

  if (!supabaseUrl || !apiKey) return null;

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!res.ok) return null;
  const data = (await res.json()) as SupabaseAuthUser | null;
  return data?.id ? data : null;
}

export async function getOptionalSessionProfile(req: Request): Promise<SessionProfile | null> {
  const accessToken = getBearerToken(req);
  if (!accessToken) return null;

  const authUser = await fetchSupabaseAuthUser(accessToken);
  if (!authUser?.id) return null;

  const rows = await supabaseAdmin.select(
    'users',
    `select=id,email,role,tenant_id,unit_id,blocked_until&id=eq.${encodeURIComponent(String(authUser.id))}&limit=1`
  ) as SessionProfile[];

  return rows?.[0] || null;
}
