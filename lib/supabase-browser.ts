'use client';

type SupabaseError = { message: string } | null;

type QueryResult<T> = Promise<{ data: T; error: SupabaseError }>;

type Filter = { type: 'eq' | 'gte' | 'lte' | 'in'; column: string; value: string | string[] };

type QueryState = {
  filters: Filter[];
  orders: Array<{ column: string; ascending: boolean }>;
  limit?: number;
  maybeSingle?: boolean;
};

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

    if (res.status === 204) return { data: null as T, error: null };
    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (e) {
    return { data: null as T, error: { message: e instanceof Error ? e.message : 'Erro desconhecido' } };
  }
}

function mapError(error: SupabaseError) {
  return error ? new Error(error.message) : null;
}

function buildQueryString(selectColumns: string, state: QueryState) {
  const params = new URLSearchParams();
  params.set('select', selectColumns);
  state.filters.forEach((f) => {
    if (f.type === 'in') {
      params.set(f.column, `in.(${(f.value as string[]).map((x) => `"${x}"`).join(',')})`);
      return;
    }
    params.set(f.column, `${f.type}.${encodeURIComponent(String(f.value))}`);
  });
  state.orders.forEach((o) => params.set('order', `${o.column}.${o.ascending ? 'asc' : 'desc'}`));
  if (state.limit) params.set('limit', String(state.limit));
  return params.toString();
}

function createSelectBuilder(table: string, columns: string, state?: Partial<QueryState>): any {
  const current: QueryState = {
    filters: state?.filters || [],
    orders: state?.orders || [],
    limit: state?.limit,
    maybeSingle: state?.maybeSingle
  };

  const run = async (single = false) => {
    const qs = buildQueryString(columns, current);
    const { data, error } = await request<any[]>(`/rest/v1/${table}?${qs}`);
    if (error) return { data: single ? null : [], error: mapError(error) };
    if (single) return { data: data?.[0] ?? null, error: null };
    return { data: data ?? [], error: null };
  };

  return {
    eq(column: string, value: string) {
      return createSelectBuilder(table, columns, { ...current, filters: [...current.filters, { type: 'eq', column, value }] });
    },
    gte(column: string, value: string) {
      return createSelectBuilder(table, columns, { ...current, filters: [...current.filters, { type: 'gte', column, value }] });
    },
    lte(column: string, value: string) {
      return createSelectBuilder(table, columns, { ...current, filters: [...current.filters, { type: 'lte', column, value }] });
    },
    in(column: string, values: string[]) {
      return createSelectBuilder(table, columns, { ...current, filters: [...current.filters, { type: 'in', column, value: values }] });
    },
    order(column: string, opts?: { ascending?: boolean }) {
      return createSelectBuilder(table, columns, { ...current, orders: [...current.orders, { column, ascending: opts?.ascending !== false }] });
    },
    limit(value: number) {
      return createSelectBuilder(table, columns, { ...current, limit: value });
    },
    single() {
      return run(true);
    },
    then(resolve: any, reject: any) {
      return run(false).then(resolve, reject);
    }
  };
}

function from(table: string) {
  return {
    select(columns: string) {
      return createSelectBuilder(table, columns);
    },

    upsert(payload: Record<string, unknown>, opts?: { onConflict?: string }) {
      return {
        async execute() {
          const conflict = opts?.onConflict ? `?on_conflict=${encodeURIComponent(opts.onConflict)}` : '';
          const path = `/rest/v1/${table}${conflict}`;
          const { error } = await request<unknown>(path, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
              Prefer: 'resolution=merge-duplicates,return=minimal'
            }
          });
          return { error: mapError(error) };
        }
      };
    },
    insert(payload: Record<string, unknown>) {
      return {
        select(columns = '*') {
          return {
            async single() {
              const { data, error } = await request<any[]>(`/rest/v1/${table}?select=${encodeURIComponent(columns)}`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { Prefer: 'return=representation' }
              });
              if (error) return { data: null, error: mapError(error) };
              return { data: data?.[0] ?? null, error: null };
            }
          };
        },
        async execute() {
          const { error } = await request<unknown>(`/rest/v1/${table}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { Prefer: 'return=minimal' }
          });
          return { error: mapError(error) };
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
