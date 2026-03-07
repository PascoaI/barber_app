'use client';

import type { Barbershop, BarbershopInput } from '@/types/barbershop';

type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string; status: number };

function isApiError<T>(result: ApiResult<T>): result is { ok: false; message: string; status: number } {
  return result.ok === false;
}

async function parseApiResult<T>(res: Response): Promise<ApiResult<T>> {
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      message: raw?.message || raw?.error || 'Operacao falhou.',
      status: res.status
    };
  }
  return { ok: true, data: raw as T };
}

export async function isSuperAdminSession() {
  const res = await fetch('/api/superadmin/session', { cache: 'no-store' });
  if (!res.ok) return false;
  const data = await res.json().catch(() => ({}));
  return Boolean(data?.authenticated);
}

export async function signInSuperAdmin(email: string, password: string) {
  const res = await fetch('/api/superadmin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const result = await parseApiResult<{ ok: boolean }>(res);
  if (isApiError(result)) return { ok: false as const, message: result.message };
  return { ok: true as const };
}

export async function signOutPlatformSession() {
  await fetch('/api/superadmin/logout', { method: 'POST' });
}

export async function listPlatformBarbershops() {
  const res = await fetch('/api/superadmin/barbershops', { cache: 'no-store' });
  const result = await parseApiResult<{ rows: Barbershop[] }>(res);
  if (isApiError(result)) throw new Error(result.message);
  return result.data.rows || [];
}

export async function findPlatformBarbershop(id: string) {
  const res = await fetch(`/api/superadmin/barbershops/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  const result = await parseApiResult<{ row: Barbershop }>(res);
  if (isApiError(result)) throw new Error(result.message);
  return result.data.row || null;
}

export async function savePlatformBarbershop(input: BarbershopInput & { password?: string }, editId?: string) {
  const method = editId ? 'PATCH' : 'POST';
  const url = editId ? `/api/superadmin/barbershops/${encodeURIComponent(editId)}` : '/api/superadmin/barbershops';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  const result = await parseApiResult<{ row: Barbershop }>(res);
  if (isApiError(result)) return { ok: false as const, message: result.message };
  return { ok: true as const, row: result.data.row };
}

export async function togglePlatformBarbershopStatus(id: string) {
  const row = await findPlatformBarbershop(id);
  if (!row) return { ok: false as const, message: 'Barbearia nao encontrada.' };
  const nextStatus = row.status === 'disabled' ? 'active' : 'disabled';
  return savePlatformBarbershop({ ...row, status: nextStatus }, id);
}

export async function resetPlatformBarbershopPassword(id: string, password = '123456') {
  const res = await fetch(`/api/superadmin/barbershops/${encodeURIComponent(id)}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const result = await parseApiResult<{ ok: boolean }>(res);
  if (isApiError(result)) return { ok: false as const, message: result.message };
  return { ok: true as const };
}

export async function removePlatformBarbershop(id: string) {
  const res = await fetch(`/api/superadmin/barbershops/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await parseApiResult<{ ok: boolean }>(res);
  if (isApiError(result)) return { ok: false as const, message: result.message };
  return { ok: true as const };
}
