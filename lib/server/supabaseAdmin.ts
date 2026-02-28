const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for server operations.');
  }
}

async function request(path: string, init?: RequestInit) {
  assertEnv();
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY as string,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

export const supabaseAdmin = {
  select: (table: string, query: string) => request(`/rest/v1/${table}?${query}`),
  insert: (table: string, payload: unknown, returning = 'representation') => request(`/rest/v1/${table}`, { method: 'POST', body: JSON.stringify(payload), headers: { Prefer: `return=${returning}` } }),
  update: (table: string, query: string, payload: unknown) => request(`/rest/v1/${table}?${query}`, { method: 'PATCH', body: JSON.stringify(payload), headers: { Prefer: 'return=representation' } })
};
