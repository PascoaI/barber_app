'use client';

type SupabaseError = { message: string } | null;

type QueryResult<T> = Promise<{ data: T; error: SupabaseError }>;

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  return { url, anon };
}

function findAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const token = parsed?.access_token ?? parsed?.currentSession?.access_token;
      if (token) return token;
    } catch {
      // ignore malformed key
    }
  }

  return null;
}

async function request<T>(path: string, init?: RequestInit): QueryResult<T> {
  try {
    const { url, anon } = getEnv();
    const token = findAccessToken();
    const res = await fetch(`${url}${path}`, {
      ...init,
      headers: {
        apikey: anon,
        Authorization: `Bearer ${token || anon}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      }
    });

    if (!res.ok) {
      const text = await res.text();
      return { data: null as T, error: { message: text || `Erro HTTP ${res.status}` } };
    }

    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (e) {
    return { data: null as T, error: { message: e instanceof Error ? e.message : 'Erro desconhecido' } };
  }
}

function mapError(error: SupabaseError) {
  return error ? new Error(error.message) : null;
}

function from(table: string) {
  return {
    select(columns: string) {
      return {
        eq(column: string, value: string) {
          return {
            async single() {
              const path = `/rest/v1/${table}?select=${encodeURIComponent(columns)}&${column}=eq.${encodeURIComponent(value)}&limit=1`;
              const { data, error } = await request<any[]>(path);
              if (error) return { data: null, error: mapError(error) };
              return { data: data?.[0] ?? null, error: null };
            }
          };
        }
      };
    },
    update(payload: Record<string, unknown>) {
      return {
        async eq(column: string, value: string) {
          const path = `/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}`;
          const { error } = await request<unknown>(path, { method: 'PATCH', body: JSON.stringify(payload), headers: { Prefer: 'return=minimal' } });
          return { error: mapError(error) };
        }
      };
    }
  };
}

async function getUser() {
  const token = findAccessToken();
  if (!token) return { data: { user: null }, error: new Error('Sessão Supabase não encontrada no navegador.') };

  const { data, error } = await request<{ id: string; email?: string }>('/auth/v1/user', { method: 'GET' });
  if (error) return { data: { user: null }, error: mapError(error) };

  return { data: { user: data }, error: null };
}

export function getSupabaseBrowserClient() {
  return {
    auth: { getUser },
    from
  };
}
