'use client';

import type { Barbershop, BarbershopInput } from '@/types/barbershop';

type PlatformUser = {
  email: string;
  password: string;
  role: string;
  name?: string;
  unit_id?: string;
  barbershop_id?: string;
};

type Session = {
  email: string;
  role: string;
  name?: string;
  unit_id?: string;
  expires_at?: string;
};

const STORAGE_KEYS = {
  session: 'barberpro_session',
  platformUsers: 'barberpro_platform_users',
  barbershops: 'barberpro_barbershops',
  tenants: 'barberpro_tenants'
} as const;

const ALLOWED_STATUS = ['active', 'trial', 'suspended', 'disabled'] as const;
const ALLOWED_PLAN = ['free', 'basic', 'pro', 'enterprise'] as const;

function normalizeStatus(status: string) {
  return ALLOWED_STATUS.includes(status as any) ? (status as Barbershop['status']) : 'active';
}

function normalizePlan(plan: string) {
  return ALLOWED_PLAN.includes(plan as any) ? (plan as Barbershop['plan']) : 'basic';
}

function nowIso() {
  return new Date().toISOString();
}

function addMinutes(dateObj: Date, minutes: number) {
  return new Date(dateObj.getTime() + minutes * 60000);
}

function slugify(text: string) {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = JSON.parse(window.localStorage.getItem(key) || 'null');
    return (raw ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function setJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function setSessionCookies(role: string, email: string) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60;
  document.cookie = `barberpro_role=${encodeURIComponent(role || '')}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `barberpro_session_email=${encodeURIComponent(email || '')}; path=/; max-age=${maxAge}; samesite=lax`;
}

function clearSessionCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'barberpro_role=; path=/; max-age=0; samesite=lax';
  document.cookie = 'barberpro_session_email=; path=/; max-age=0; samesite=lax';
}

function ensureSeed() {
  const users = getJson<PlatformUser[]>(STORAGE_KEYS.platformUsers, []);
  if (!users.length) {
    setJson(STORAGE_KEYS.platformUsers, [
      { email: 'super@barber.com', password: '123456', role: 'super_admin', name: 'Super Admin', unit_id: 'unit_bom_fim' },
      { email: 'admin@barber.com', password: '123456', role: 'admin', name: 'Administrador', unit_id: 'unit_bom_fim', barbershop_id: 'unit_bom_fim' }
    ]);
  }

  const shops = getJson<Barbershop[]>(STORAGE_KEYS.barbershops, []);
  if (!shops.length) {
    setJson(STORAGE_KEYS.barbershops, [
      {
        id: 'unit_bom_fim',
        name: 'Barbearia XZ',
        owner_name: 'Administrador',
        email: 'admin@barber.com',
        phone: '(51) 99999-0000',
        address: 'Rua Fernandes Vieira, 631 - Bom Fim, Porto Alegre, RS',
        status: 'active',
        plan: 'basic',
        plan_expires_at: null,
        created_at: nowIso(),
        updated_at: nowIso()
      }
    ]);
  }
}

function syncTenant(shop: Barbershop) {
  const tenants = getJson<any[]>(STORAGE_KEYS.tenants, []);
  const idx = tenants.findIndex((t) => t.id === shop.id);
  const payload = {
    id: shop.id,
    name: shop.name,
    subscription_plan_id: (tenants[idx] && tenants[idx].subscription_plan_id) || shop.plan || 'basic',
    subscription_status: shop.status === 'disabled' ? 'disabled' : shop.status === 'suspended' ? 'suspended' : 'active',
    created_at: (tenants[idx] && tenants[idx].created_at) || shop.created_at || nowIso(),
    updated_at: nowIso()
  };
  if (idx >= 0) tenants[idx] = { ...tenants[idx], ...payload };
  else tenants.unshift(payload);
  setJson(STORAGE_KEYS.tenants, tenants);
}

function removeTenant(shopId: string) {
  const tenants = getJson<any[]>(STORAGE_KEYS.tenants, []);
  setJson(STORAGE_KEYS.tenants, tenants.filter((t) => t.id !== shopId));
}

function upsertAdminUser(shop: Barbershop, passwordOverride = '') {
  const users = getJson<PlatformUser[]>(STORAGE_KEYS.platformUsers, []);
  const idx = users.findIndex((u) => u.email.toLowerCase() === shop.email.toLowerCase());
  const password = passwordOverride || '123456';
  const payload: PlatformUser = {
    email: shop.email,
    password,
    role: 'admin',
    name: shop.owner_name || 'Administrador',
    unit_id: shop.id,
    barbershop_id: shop.id
  };
  if (idx >= 0) users[idx] = { ...users[idx], ...payload };
  else users.push(payload);
  setJson(STORAGE_KEYS.platformUsers, users);
}

function removeAdminUser(email: string) {
  const users = getJson<PlatformUser[]>(STORAGE_KEYS.platformUsers, []);
  setJson(STORAGE_KEYS.platformUsers, users.filter((u) => !(u.role === 'admin' && u.email.toLowerCase() === email.toLowerCase())));
}

export function getCurrentPlatformSession() {
  ensureSeed();
  return getJson<Session | null>(STORAGE_KEYS.session, null);
}

export function isSuperAdminSession() {
  const session = getCurrentPlatformSession();
  return session?.role === 'super_admin';
}

export function signInSuperAdmin(email: string, password: string) {
  ensureSeed();
  const users = getJson<PlatformUser[]>(STORAGE_KEYS.platformUsers, []);
  const user = users.find((u) => u.role === 'super_admin' && u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) return { ok: false as const, message: 'Credenciais do SuperAdmin inválidas.' };

  const session: Session = {
    email: user.email,
    role: user.role,
    name: user.name || 'Super Admin',
    unit_id: user.unit_id || 'unit_bom_fim',
    expires_at: addMinutes(new Date(), 60).toISOString()
  };
  setJson(STORAGE_KEYS.session, session);
  setSessionCookies(session.role, session.email);
  return { ok: true as const };
}

export function signOutPlatformSession() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEYS.session);
  clearSessionCookies();
}

export function listPlatformBarbershops() {
  ensureSeed();
  const rows = getJson<Barbershop[]>(STORAGE_KEYS.barbershops, []).map((row) => ({
    ...row,
    status: normalizeStatus(String((row as any).status || 'active')),
    plan: normalizePlan(String((row as any).plan || 'basic')),
    plan_expires_at: (row as any).plan_expires_at || null
  }));
  return rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

export function findPlatformBarbershop(id: string) {
  return listPlatformBarbershops().find((x) => x.id === id) || null;
}

export function savePlatformBarbershop(input: BarbershopInput, editId?: string) {
  ensureSeed();
  const rows = listPlatformBarbershops();
  const normalizedEmail = String(input.email || '').trim().toLowerCase();
  const duplicate = rows.some((x) => x.email.toLowerCase() === normalizedEmail && x.id !== editId);
  if (duplicate) return { ok: false as const, message: 'Já existe uma barbearia com este email.' };

  const now = nowIso();
  const existing = editId ? rows.find((x) => x.id === editId) : null;
  const id = existing?.id || `shop_${slugify(input.name || input.owner_name || 'barbearia')}_${Date.now().toString().slice(-6)}`;

  const row: Barbershop = {
    id,
    name: String(input.name || '').trim(),
    owner_name: String(input.owner_name || '').trim(),
    email: normalizedEmail,
    phone: String(input.phone || '').trim(),
    address: String(input.address || '').trim(),
    status: normalizeStatus(String(input.status || existing?.status || 'active')),
    plan: normalizePlan(String(input.plan || existing?.plan || 'basic')),
    plan_expires_at: input.plan_expires_at || existing?.plan_expires_at || null,
    created_at: existing?.created_at || now,
    updated_at: now
  };

  const next = existing ? rows.map((x) => (x.id === id ? row : x)) : [row, ...rows];
  setJson(STORAGE_KEYS.barbershops, next);
  syncTenant(row);
  upsertAdminUser(row, (input as any).password || '');
  return { ok: true as const, row };
}

export function togglePlatformBarbershopStatus(id: string) {
  const current = findPlatformBarbershop(id);
  if (!current) return { ok: false as const, message: 'Barbearia não encontrada.' };
  return savePlatformBarbershop({ ...current, status: current.status === 'disabled' ? 'active' : 'disabled' }, id);
}

export function resetPlatformBarbershopPassword(id: string, password = '123456') {
  const shop = findPlatformBarbershop(id);
  if (!shop) return { ok: false as const, message: 'Barbearia não encontrada.' };
  upsertAdminUser(shop, password);
  return { ok: true as const };
}

export function removePlatformBarbershop(id: string) {
  const rows = listPlatformBarbershops();
  const target = rows.find((x) => x.id === id);
  if (!target) return { ok: false as const, message: 'Barbearia não encontrada.' };
  setJson(STORAGE_KEYS.barbershops, rows.filter((x) => x.id !== id));
  removeTenant(id);
  removeAdminUser(target.email);
  return { ok: true as const };
}
