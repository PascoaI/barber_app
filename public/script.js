// AUTO-GENERATED FILE. Source: legacy-src/script/*.js

﻿const DEFAULT_UNIT_ID = 'unit_bom_fim';
const DEFAULT_TENANT_ID = 'tenant_barberpro_demo';

const APP_CONFIG = {
  unitId: DEFAULT_UNIT_ID,
  tenantId: DEFAULT_TENANT_ID
};

const BASE_DATA = {
  units: [
    {
      id: DEFAULT_UNIT_ID,
      tenant_id: DEFAULT_TENANT_ID,
      name: 'Barbearia X',
      city: 'Porto Alegre',
      address: 'Rua Fernandes Vieira, 631 - Bom Fim, Porto Alegre, RS'
    }
  ],
  cities: [
    {
      id: 'poa',
      name: 'Porto Alegre',
      branches: [{ id: 'bom-fim', name: 'Bom Fim', address: 'Rua Fernandes Vieira, 631 - Bom Fim, Porto Alegre, RS', unit_id: DEFAULT_UNIT_ID }]
    }
  ],
  services: [
    { id: 'corte', name: 'Corte', duration_minutes: 30, price: 72, barber_id: null, unit_id: DEFAULT_UNIT_ID, requires_pre_payment: false, emoji: '✂️' },
    { id: 'corte-sobrancelha', name: 'Corte + Sobrancelha', duration_minutes: 45, price: 89, barber_id: null, unit_id: DEFAULT_UNIT_ID, requires_pre_payment: true, emoji: '🧔' },
    { id: 'hidratacao', name: 'Hidratação', duration_minutes: 60, price: 58, barber_id: null, unit_id: DEFAULT_UNIT_ID, requires_pre_payment: false, emoji: '💧' },
    { id: 'corte-hidratacao', name: 'Corte + Hidratação', duration_minutes: 90, price: 124, barber_id: null, unit_id: DEFAULT_UNIT_ID, requires_pre_payment: true, emoji: '✨' },
    { id: 'barba', name: 'Barba', duration_minutes: 30, price: 54, barber_id: null, unit_id: DEFAULT_UNIT_ID, requires_pre_payment: false, emoji: '🪒' },
    { id: 'corte-barba', name: 'Corte + Barba', duration_minutes: 60, price: 112, barber_id: null, unit_id: DEFAULT_UNIT_ID, requires_pre_payment: true, emoji: '🔥' },
    { id: 'pigmentacao-barba', name: 'Pigmentação de Barba', duration_minutes: 45, price: 78, barber_id: null, unit_id: DEFAULT_UNIT_ID, requires_pre_payment: false, emoji: '🎯' },
    { id: 'pezinho-acabamento', name: 'Pezinho + Acabamento', duration_minutes: 20, price: 38, barber_id: null, unit_id: DEFAULT_UNIT_ID, requires_pre_payment: false, emoji: '🧩' }
  ],
  serviceProducts: [
    { service_id: 'corte', product_id: 'pomada', quantity: 1 },
    { service_id: 'hidratacao', product_id: 'mascara', quantity: 1 }
  ]
};

const BASE_USERS = [
  { email: 'cliente@barber.com', password: '123456', role: 'client', name: 'Cliente', unit_id: DEFAULT_UNIT_ID },
  { email: 'lucas@barber.com', password: '123456', role: 'client', name: 'Lucas Pascoal', unit_id: DEFAULT_UNIT_ID },
  { email: 'rafael@barber.com', password: '123456', role: 'client', name: 'Rafael Souza', unit_id: DEFAULT_UNIT_ID },
  { email: 'admin@barber.com', password: '123456', role: 'admin', name: 'Administrador', unit_id: DEFAULT_UNIT_ID },
  { email: 'super@barber.com', password: '123456', role: 'super_admin', name: 'Super Admin', unit_id: DEFAULT_UNIT_ID }
];

const DEFAULT_BARBERS = [
  { id: 'pedro', name: 'Pedro', email: 'pedro@barber.com', password: '123456', commission_percentage: 40, active: true, unit_id: DEFAULT_UNIT_ID, avatar: '👨🏽' },
  { id: 'nataniel', name: 'Nataniel', email: 'nataniel@barber.com', password: '123456', commission_percentage: 45, active: true, unit_id: DEFAULT_UNIT_ID, avatar: '👨🏾' }
];

const DEFAULT_PLATFORM_PLANS = [
  { id: 'starter', name: 'Starter', max_units: 1, max_barbers: 5, analytics_enabled: true, loyalty_enabled: true, stock_enabled: true, subscription_enabled: true },
  { id: 'growth', name: 'Growth', max_units: 3, max_barbers: 20, analytics_enabled: true, loyalty_enabled: true, stock_enabled: true, subscription_enabled: true }
];

const STORAGE_KEYS = {
  session: 'barberpro_session',
  booking: 'barberpro_booking',
  appointments: 'barberpro_appointments',
  barbers: 'barberpro_barbers',
  blockedSlots: 'barberpro_blocked_slots',
  payments: 'barberpro_payments',
  commissions: 'barberpro_commissions',
  loyaltyPoints: 'barberpro_loyalty_points',
  loyaltyTx: 'barberpro_loyalty_transactions',
  reviews: 'barberpro_reviews',
  products: 'barberpro_products',
  productMovements: 'barberpro_product_movements',
  subscriptionPlans: 'barberpro_subscription_plans',
  subscriptions: 'barberpro_subscriptions',
  notifications: 'barberpro_notifications',
  tenants: 'barberpro_tenants',
  platformPlans: 'barberpro_platform_plans',
  unitSettings: 'barberpro_unit_settings',
  userPolicies: 'barberpro_user_policies',
  brand: 'barberpro_brand',
  audit: 'barberpro_audit',
  locks: 'barberpro_locks',
  cache: 'barberpro_cache',
  subscriptionUsage: 'barberpro_subscription_usage',
  clientFavorites: 'barberpro_client_favorites',
  clientProfiles: 'barberpro_client_profiles',
  platformUsers: 'barberpro_platform_users',
  barbershops: 'barberpro_barbershops'
};

const APPOINTMENT_STATUS = ['awaiting_payment', 'pending', 'confirmed', 'canceled', 'completed', 'no_show'];
const APPOINTMENT_TRANSITIONS = {
  awaiting_payment: ['pending', 'confirmed', 'canceled'],
  pending: ['confirmed', 'canceled', 'completed', 'no_show'],
  confirmed: ['completed', 'canceled', 'no_show'],
  canceled: [],
  completed: [],
  no_show: []
};

const DEFAULT_BRAND = { shopName: 'Barbearia X', primaryColor: '#d4a24f', logoUrl: '' };
const DEFAULT_UNIT_SETTINGS = {
  unit_id: DEFAULT_UNIT_ID,
  opening_time: '09:00',
  closing_time: '19:00',
  slot_interval_minutes: 30,
  cancellation_limit_hours: 3,
  min_advance_minutes: 60,
  buffer_between_appointments_minutes: 10,
  no_show_block_limit: 3,
  no_show_block_days: 7,
  loyalty_enabled: true,
  prepayment_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const BOOKING_DEFAULT = { city: '', branch: '', service: '', professional: '', date: '', time: '', edit_appointment_id: null };


function ensureBookingConsistency() {
  const booking = getBooking();
  const city = BASE_DATA.cities.find((c) => c.id === booking.city);
  const branch = city?.branches.find((b) => b.id === booking.branch);
  const service = getServiceById(booking.service);
  const professionalValid = booking.professional === 'sem-preferencia' || getBarbers(true).some((b) => b.id === booking.professional);

  const next = { ...booking };
  if (!city) {
    next.city = '';
    next.branch = '';
    next.service = '';
    next.professional = '';
    next.date = '';
    next.time = '';
  } else if (!branch) {
    next.branch = '';
    next.service = '';
    next.professional = '';
    next.date = '';
    next.time = '';
  }

  if (!service) {
    next.service = '';
    next.professional = '';
    next.date = '';
    next.time = '';
  }

  if (next.professional && !professionalValid) {
    next.professional = '';
    next.date = '';
    next.time = '';
  }

  const validDates = new Set(getNextDays().map((d) => d.value));
  if (next.date && !validDates.has(next.date)) {
    next.date = '';
    next.time = '';
  }

  if (JSON.stringify(next) !== JSON.stringify(booking)) saveBooking(next);
  return next;
}

const DB_CONFIG = { supabaseUrl: '', supabaseAnonKey: '', table: 'appointments' };
const SESSION_TTL_MINUTES = 60;
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;
const TEST_MODE_ALLOW_ANY_CANCELLATION = false;
const nowIso = () => new Date().toISOString();
const asCurrency = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

function getJson(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

function setJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getPlatformUsers() {
  const fromStorage = getJson(STORAGE_KEYS.platformUsers, []);
  if (!fromStorage.length) return [...BASE_USERS];
  return fromStorage;
}

function savePlatformUsers(rows) {
  setJson(STORAGE_KEYS.platformUsers, rows);
}

function getBarbershops() {
  return getJson(STORAGE_KEYS.barbershops, []);
}

function saveBarbershops(rows) {
  setJson(STORAGE_KEYS.barbershops, rows);
}

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function ensureSeed() {
  if (!getJson(STORAGE_KEYS.barbers, []).length) setJson(STORAGE_KEYS.barbers, DEFAULT_BARBERS);
  if (!getJson(STORAGE_KEYS.brand, null)) setJson(STORAGE_KEYS.brand, DEFAULT_BRAND);
  if (!getJson(STORAGE_KEYS.unitSettings, null)) setJson(STORAGE_KEYS.unitSettings, DEFAULT_UNIT_SETTINGS);
  if (!getJson(STORAGE_KEYS.products, []).length) {
    setJson(STORAGE_KEYS.products, [
      { id: 'pomada', unit_id: APP_CONFIG.unitId, name: 'Pomada Modeladora', quantity: 20, minimum_stock: 5, created_at: nowIso(), updated_at: nowIso() },
      { id: 'mascara', unit_id: APP_CONFIG.unitId, name: 'Máscara de Hidratação', quantity: 10, minimum_stock: 3, created_at: nowIso(), updated_at: nowIso() }
    ]);
  }
  ensureDefaultSubscriptionPlans();
  if (!getJson(STORAGE_KEYS.platformPlans, []).length) setJson(STORAGE_KEYS.platformPlans, DEFAULT_PLATFORM_PLANS);
  if (!getJson(STORAGE_KEYS.tenants, []).length) {
    setJson(STORAGE_KEYS.tenants, [
      { id: DEFAULT_TENANT_ID, name: 'BarberPro Demo', subscription_plan_id: 'growth', subscription_status: 'active', created_at: nowIso(), updated_at: nowIso() }
    ]);
  }

  if (!getJson(STORAGE_KEYS.clientProfiles, null)) {
    setJson(STORAGE_KEYS.clientProfiles, {
      'cliente@barber.com': {
        name: 'Cliente',
        email: 'cliente@barber.com',
        phone: '(51) 99999-0000',
        favorite_barber_id: null,
        default_unit_id: APP_CONFIG.unitId,
        photo_url: ''
      }
    });
  }
  if (!getJson(STORAGE_KEYS.clientFavorites, null)) setJson(STORAGE_KEYS.clientFavorites, {});
  if (!getJson(STORAGE_KEYS.platformUsers, null)) setJson(STORAGE_KEYS.platformUsers, BASE_USERS);
  if (!getJson(STORAGE_KEYS.barbershops, null)) {
    setJson(STORAGE_KEYS.barbershops, [
      {
        id: DEFAULT_UNIT_ID,
        barbershop_id: DEFAULT_UNIT_ID,
        tenant_id: DEFAULT_TENANT_ID,
        name: 'Barbearia XZ',
        owner_name: 'Administrador',
        email: 'admin@barber.com',
        phone: '(51) 99999-0000',
        password_hash: 'plain:123456',
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




function ensureDefaultSubscriptionPlans() {
  const defaults = [
    { id: 'plano-bronze', unit_id: APP_CONFIG.unitId, name: '🥉 Plano Bronze', price: 59, sessions_per_month: 2, duration_days: 30, is_active: true, benefits: ['2 cortes por mês', 'Suporte padrão'], created_at: nowIso(), updated_at: nowIso() },
    { id: 'plano-prata', unit_id: APP_CONFIG.unitId, name: '🥈 Plano Prata', price: 99, sessions_per_month: 4, duration_days: 30, is_active: true, benefits: ['4 cortes por mês', 'Prioridade de agendamento'], created_at: nowIso(), updated_at: nowIso() },
    { id: 'plano-ouro', unit_id: APP_CONFIG.unitId, name: '🥇 Plano Ouro', price: 149, sessions_per_month: 6, duration_days: 30, is_active: true, benefits: ['6 cortes por mês', 'Prioridade máxima', 'Benefícios extras'], created_at: nowIso(), updated_at: nowIso() }
  ];

  const all = getJson(STORAGE_KEYS.subscriptionPlans, []);
  const current = all.filter((p) => p.unit_id === APP_CONFIG.unitId);
  const keep = all.filter((p) => p.unit_id !== APP_CONFIG.unitId);

  const merged = [...current];
  defaults.forEach((d) => {
    const idx = merged.findIndex((x) => x.id === d.id);
    if (idx >= 0) merged[idx] = { ...d, ...merged[idx], benefits: merged[idx].benefits || d.benefits, updated_at: nowIso() };
    else merged.push(d);
  });

  setJson(STORAGE_KEYS.subscriptionPlans, [...merged, ...keep].map((plan) => ({ ...plan, is_active: plan.is_active !== false })));
}

function showAppModal(options) {
  const {
    title = 'Confirmação',
    message = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    hideCancel = false
  } = options || {};

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[120] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-borderc bg-surface shadow-soft p-5 md:p-6 grid gap-4">
      <div class="grid gap-2">
        <h2 class="text-xl font-semibold text-text-primary">${sanitizeText(title)}</h2>
        <p class="text-sm text-text-secondary leading-relaxed">${sanitizeText(message).replace(/\n/g, '<br>')}</p>
      </div>
      <div class="grid gap-2 ${hideCancel ? '' : 'md:grid-cols-2'}">
        ${hideCancel ? '' : `<button type="button" data-modal-cancel class="button button-secondary inline-flex items-center justify-center rounded-xl px-4 min-h-11 font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary border border-borderc bg-surface text-text-primary hover:border-primary/70 hover:shadow-md hover:scale-[1.01]">` + sanitizeText(cancelText) + `</button>`}
        <button type="button" data-modal-confirm class="button button-primary inline-flex items-center justify-center rounded-xl px-4 min-h-11 font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary bg-primary text-zinc-900 hover:bg-primary-dark hover:shadow-md hover:scale-[1.01]">${sanitizeText(confirmText)}</button>
      </div>
    </div>
  `;

  return new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      document.removeEventListener('keydown', onKeyDown);
      modal.remove();
      resolve(value);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') settle(false);
    };
    document.addEventListener('keydown', onKeyDown);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) settle(false);
    });

    modal.querySelector('[data-modal-confirm]')?.addEventListener('click', () => settle(true));
    modal.querySelector('[data-modal-cancel]')?.addEventListener('click', () => settle(false));

    document.body.appendChild(modal);
    modal.querySelector('[data-modal-confirm]')?.focus();
  });
}

async function confirmAction(message, options = {}) {
  return showAppModal({
    title: options.title || 'Confirmar ação',
    message,
    confirmText: options.confirmText || 'Confirmar',
    cancelText: options.cancelText || 'Cancelar'
  });
}

async function alertAction(message, options = {}) {
  await showAppModal({
    title: options.title || 'Aviso',
    message,
    confirmText: options.confirmText || 'Entendi',
    hideCancel: true
  });
}

function logAudit(action, details = {}) {
  const audit = getJson(STORAGE_KEYS.audit, []);
  const session = getSession();
  audit.unshift({ action, details, by: session?.email || 'system', at: nowIso(), unit_id: session?.unit_id || APP_CONFIG.unitId, tenant_id: APP_CONFIG.tenantId });
  setJson(STORAGE_KEYS.audit, audit.slice(0, 1500));
}

function getSession() {
  return getJson(STORAGE_KEYS.session, null);
}

function setSession(user) {
  const payload = {
    email: user.email,
    role: user.role,
    name: user.name,
    barberId: user.barberId || null,
    unit_id: user.unit_id || DEFAULT_UNIT_ID,
    expires_at: addMinutes(new Date(), SESSION_TTL_MINUTES).toISOString()
  };
  setJson(STORAGE_KEYS.session, payload);
  try {
    const maxAge = SESSION_TTL_MINUTES * 60;
    document.cookie = `barberpro_role=${encodeURIComponent(payload.role || '')}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `barberpro_session_email=${encodeURIComponent(payload.email || '')}; path=/; max-age=${maxAge}; samesite=lax`;
  } catch {}
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
  try {
    document.cookie = 'barberpro_role=; path=/; max-age=0; samesite=lax';
    document.cookie = 'barberpro_session_email=; path=/; max-age=0; samesite=lax';
  } catch {}
}

function sanitizeText(value) {
  return String(value || '').replace(/[<>]/g, '').trim();
}

function normalizeCredential(value) {
  return String(value || '').normalize('NFC');
}

function hasRole(...roles) {
  return roles.includes(getSession()?.role);
}

function getUserPolicies() {
  return getJson(STORAGE_KEYS.userPolicies, {});
}

function getUserBlockedUntil(email) {
  return getUserPolicies()[email]?.blocked_until || null;
}

function setUserBlockedUntil(email, isoDate) {
  const policies = getUserPolicies();
  policies[email] = { ...(policies[email] || {}), blocked_until: isoDate, updated_at: nowIso() };
  setJson(STORAGE_KEYS.userPolicies, policies);
}

function canClientBook(email) {
  const blocked = getUserBlockedUntil(email);
  if (!blocked) return true;
  return new Date(blocked) <= new Date();
}

function requireRole(roles, redirect = 'login.html') {
  const session = getSession();
  if (!session) {
    window.location.href = `${redirect}?redirect=${encodeURIComponent(window.location.pathname.split('/').pop())}`;
    return false;
  }
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    clearSession();
    window.location.href = `${redirect}?expired=1`;
    return false;
  }
  if (!roles.includes(session.role)) {
    window.location.href = session.role === 'client' ? 'client-home.html' : session.role === 'barber' ? 'barber-home.html' : session.role === 'super_admin' ? 'super-admin-tenants.html' : 'admin-home.html';
    return false;
  }
  return true;
}

function getBrandSettings() {
  return { ...DEFAULT_BRAND, ...getJson(STORAGE_KEYS.brand, {}) };
}

function saveBrandSettings(brand) {
  setJson(STORAGE_KEYS.brand, { ...getBrandSettings(), ...brand });
}

function applyBrandTheme() {
  const brand = getBrandSettings();
  document.documentElement.style.setProperty('--primary', brand.primaryColor || DEFAULT_BRAND.primaryColor);
}

function getUnitSettings() {
  return { ...DEFAULT_UNIT_SETTINGS, ...getJson(STORAGE_KEYS.unitSettings, {}) };
}

function saveUnitSettings(settings) {
  setJson(STORAGE_KEYS.unitSettings, { ...getUnitSettings(), ...settings, updated_at: nowIso() });
  logAudit('unit_settings_updated', settings);
}

function getBarbers(activeOnly = false) {
  const list = getJson(STORAGE_KEYS.barbers, DEFAULT_BARBERS).filter((b) => b.unit_id === APP_CONFIG.unitId && !b.deleted_at);
  return activeOnly ? list.filter((b) => b.active) : list;
}

function saveBarbers(rows) {
  const keep = getJson(STORAGE_KEYS.barbers, []).filter((b) => b.unit_id !== APP_CONFIG.unitId);
  setJson(STORAGE_KEYS.barbers, [...rows, ...keep]);
}

function getServices() {
  return BASE_DATA.services.filter((s) => s.unit_id === APP_CONFIG.unitId && !s.deleted_at);
}

function withTransaction(action, handlers) {
  const snapshot = handlers.snapshot();
  try {
    return action();
  } catch (error) {
    handlers.restore(snapshot);
    throw error;
  }
}

function acquireLock(lockName, ttlMs = 5000) {
  const locks = getJson(STORAGE_KEYS.locks, {});
  const now = Date.now();
  const current = locks[lockName];
  if (current && current.expires_at > now) return false;
  locks[lockName] = { token: `${now}_${Math.random().toString(16).slice(2, 8)}`, expires_at: now + ttlMs };
  setJson(STORAGE_KEYS.locks, locks);
  return true;
}

function releaseLock(lockName) {
  const locks = getJson(STORAGE_KEYS.locks, {});
  delete locks[lockName];
  setJson(STORAGE_KEYS.locks, locks);
}

function invalidateDashboardCache(reason = 'manual') {
  const cache = getJson(STORAGE_KEYS.cache, {});
  delete cache.dashboardMetrics;
  delete cache.analytics;
  setJson(STORAGE_KEYS.cache, cache);
  logAudit('dashboard_cache_invalidated', { reason });
}

function getCached(key, computeFn, ttlMs = DASHBOARD_CACHE_TTL_MS) {
  const cache = getJson(STORAGE_KEYS.cache, {});
  const item = cache[key];
  if (item && Date.now() - item.timestamp < ttlMs) return item.value;
  const value = computeFn();
  cache[key] = { value, timestamp: Date.now() };
  setJson(STORAGE_KEYS.cache, cache);
  return value;
}

function getServiceById(id) {
  return getServices().find((s) => s.id === id);
}

function getAppointments() {
  return getJson(STORAGE_KEYS.appointments, []).filter((a) => a.unit_id === APP_CONFIG.unitId && !a.deleted_at);
}

function saveAppointments(rows) {
  const keep = getJson(STORAGE_KEYS.appointments, []).filter((a) => a.unit_id !== APP_CONFIG.unitId || a.deleted_at);
  setJson(STORAGE_KEYS.appointments, [...rows, ...keep]);
}

function getBlockedSlots() {
  return getJson(STORAGE_KEYS.blockedSlots, []).filter((b) => b.unit_id === APP_CONFIG.unitId && !b.deleted_at);
}

function saveBlockedSlots(rows) {
  const keep = getJson(STORAGE_KEYS.blockedSlots, []).filter((b) => b.unit_id !== APP_CONFIG.unitId || b.deleted_at);
  setJson(STORAGE_KEYS.blockedSlots, [...rows, ...keep]);
}

function getProducts() {
  return getJson(STORAGE_KEYS.products, []).filter((p) => p.unit_id === APP_CONFIG.unitId && !p.deleted_at);
}

function saveProducts(rows) {
  const keep = getJson(STORAGE_KEYS.products, []).filter((p) => p.unit_id !== APP_CONFIG.unitId || p.deleted_at);
  setJson(STORAGE_KEYS.products, [...rows, ...keep]);
}


function getPayments() {
  return getJson(STORAGE_KEYS.payments, []).filter((p) => p.unit_id === APP_CONFIG.unitId && !p.deleted_at);
}

function savePayments(rows) {
  const keep = getJson(STORAGE_KEYS.payments, []).filter((p) => p.unit_id !== APP_CONFIG.unitId || p.deleted_at);
  setJson(STORAGE_KEYS.payments, [...rows, ...keep]);
}

function getProductMovements() {
  return getJson(STORAGE_KEYS.productMovements, []).filter((m) => m.unit_id === APP_CONFIG.unitId);
}

function saveProductMovements(rows) {
  const keep = getJson(STORAGE_KEYS.productMovements, []).filter((m) => m.unit_id !== APP_CONFIG.unitId);
  setJson(STORAGE_KEYS.productMovements, [...rows, ...keep]);
}

function getSubscriptions() {
  return getJson(STORAGE_KEYS.subscriptions, []).filter((s) => s.unit_id === APP_CONFIG.unitId && !s.deleted_at);
}

function saveSubscriptions(rows) {
  const keep = getJson(STORAGE_KEYS.subscriptions, []).filter((s) => s.unit_id !== APP_CONFIG.unitId || s.deleted_at);
  setJson(STORAGE_KEYS.subscriptions, [...rows, ...keep]);
}

function getSubscriptionPlans() {
  return getJson(STORAGE_KEYS.subscriptionPlans, []).filter((p) => p.unit_id === APP_CONFIG.unitId);
}

function saveSubscriptionPlans(rows) {
  const keep = getJson(STORAGE_KEYS.subscriptionPlans, []).filter((p) => p.unit_id !== APP_CONFIG.unitId);
  setJson(STORAGE_KEYS.subscriptionPlans, [...rows, ...keep]);
}

function getBooking() {
  return { ...BOOKING_DEFAULT, ...getJson(STORAGE_KEYS.booking, {}) };
}

function saveBooking(partial) {
  setJson(STORAGE_KEYS.booking, { ...getBooking(), ...partial });
}

function resetBooking() {
  setJson(STORAGE_KEYS.booking, { ...BOOKING_DEFAULT });
}

function getBookingStatusLabel(status) {
  const map = {
    awaiting_payment: 'Aguardando pagamento',
    pending: 'Pendente',
    confirmed: 'Confirmado',
    canceled: 'Cancelado',
    completed: 'Concluído'
  };
  return map[status] || status;
}


function getClientProfile(email) {
  const all = getJson(STORAGE_KEYS.clientProfiles, {});
  return all[email] || { name: email?.split('@')[0] || 'Cliente', email, phone: '', favorite_barber_id: null, default_unit_id: APP_CONFIG.unitId, photo_url: '' };
}

function saveClientProfile(email, patch) {
  const all = getJson(STORAGE_KEYS.clientProfiles, {});
  all[email] = { ...getClientProfile(email), ...patch, updated_at: nowIso() };
  setJson(STORAGE_KEYS.clientProfiles, all);
}

function getClientFavorite(email) {
  const all = getJson(STORAGE_KEYS.clientFavorites, {});
  return all[email] || null;
}

function saveClientFavorite(email, barberId) {
  const all = getJson(STORAGE_KEYS.clientFavorites, {});
  all[email] = barberId;
  setJson(STORAGE_KEYS.clientFavorites, all);
  saveClientProfile(email, { favorite_barber_id: barberId });
}

function getClientSubscription(email) {
  return getSubscriptions().find((s) => s.user_id === email && s.status === 'active');
}

function getSubscriptionUsage() {
  return getJson(STORAGE_KEYS.subscriptionUsage, []).filter((u) => u.unit_id === APP_CONFIG.unitId);
}

function saveSubscriptionUsage(rows) {
  const keep = getJson(STORAGE_KEYS.subscriptionUsage, []).filter((u) => u.unit_id !== APP_CONFIG.unitId);
  setJson(STORAGE_KEYS.subscriptionUsage, [...rows, ...keep]);
}

function registerSubscriptionUsage(appointment) {
  const sub = getClientSubscription(appointment.client_email);
  if (!sub || sub.remaining_sessions <= 0) return;

  const subs = getSubscriptions();
  const idx = subs.findIndex((s) => s.id === sub.id);
  if (idx < 0) return;
  subs[idx].remaining_sessions = Math.max(0, Number(subs[idx].remaining_sessions || 0) - 1);
  subs[idx].updated_at = nowIso();
  saveSubscriptions(subs);

  const usage = getSubscriptionUsage();
  usage.unshift({ id: `suse_${Date.now()}`, unit_id: APP_CONFIG.unitId, subscription_id: sub.id, appointment_id: appointment.id, client_id: appointment.client_email, service_name: appointment.service_name, barber_name: appointment.barber_name, used_at: nowIso() });
  saveSubscriptionUsage(usage);
}

function getClientCompletedAppointments(email) {
  return getAppointments().filter((a) => a.client_email === email && a.status === 'completed');
}

function getNotifications() {
  return getJson(STORAGE_KEYS.notifications, []).filter((n) => n.unit_id === APP_CONFIG.unitId);
}

function saveNotifications(rows) {
  const keep = getJson(STORAGE_KEYS.notifications, []).filter((n) => n.unit_id !== APP_CONFIG.unitId);
  setJson(STORAGE_KEYS.notifications, [...rows, ...keep]);
}

function scheduleNotification(payload) {
  const all = getNotifications();
  all.unshift({ id: `ntf_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`, unit_id: APP_CONFIG.unitId, status: 'pending', created_at: nowIso(), ...payload });
  saveNotifications(all);
}

function populateSelect(select, options, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach((o) => {
    const el = document.createElement('option');
    el.value = o.id || o.value;
    el.textContent = o.name || o.label;
    select.appendChild(el);
  });
}

function getNextDays(count = 7) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return { value: d.toISOString().slice(0, 10), label: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(d) };
  });
}

function getTimeslots() {
  const settings = getUnitSettings();
  const slots = [];
  const [oh, om] = settings.opening_time.split(':').map(Number);
  const [ch, cm] = settings.closing_time.split(':').map(Number);
  const openM = oh * 60 + om;
  const closeM = ch * 60 + cm;
  for (let m = openM; m <= closeM; m += Number(settings.slot_interval_minutes || 30)) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

function toDate(date, time) {
  return new Date(`${date}T${time}:00`);
}

function addMinutes(dateObj, minutes) {
  return new Date(dateObj.getTime() + minutes * 60000);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function isSlotAvailable({ barberId, date, time, serviceDuration, editingAppointmentId = null }) {
  const start = toDate(date, time);
  const end = addMinutes(start, serviceDuration);
  const settings = getUnitSettings();
  const close = toDate(date, settings.closing_time);
  const minAdvanceMinutes = Number(settings.min_advance_minutes || 60);
  const bufferMinutes = Number(settings.buffer_between_appointments_minutes || 0);

  if (start.getTime() < Date.now() + minAdvanceMinutes * 60000) return false;
  if (end > close) return false;

  const blockedConflict = getBlockedSlots()
    .filter((b) => b.barber_id === barberId)
    .some((b) => overlaps(start, end, new Date(b.start_datetime), new Date(b.end_datetime)));
  if (blockedConflict) return false;

  const busy = getAppointments()
    .filter((a) => a.barber_id === barberId && ['awaiting_payment', 'pending', 'confirmed'].includes(a.status))
    .some((a) => {
      if (editingAppointmentId && a.id === editingAppointmentId) return false;
      const existingStart = addMinutes(new Date(a.start_datetime), -bufferMinutes);
      const existingEnd = addMinutes(new Date(a.end_datetime), bufferMinutes);
      return overlaps(start, end, existingStart, existingEnd);
    });

  return !busy;
}


function formatBookingDateTime(date, time) {
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
  return `${formattedDate} - ${time}`;
}


function autoUpdateAppointmentStatuses() {
  const rows = getAppointments();
  const now = new Date();
  const payments = getPayments();
  const settings = getUnitSettings();
  const limit = Number(settings.no_show_block_limit || 3);
  const blockDays = Number(settings.no_show_block_days || 7);
  let changed = false;

  rows.forEach((a) => {
    if (!['pending', 'confirmed'].includes(a.status)) return;
    if (new Date(a.start_datetime) > now) return;
    const wasPaid = payments.some((p) => p.appointment_id === a.id && p.status === 'paid');
    a.status = deriveAutoStatus(a.status, a.start_datetime, wasPaid);
    a.updated_at = nowIso();
    a.updated_by = 'system_auto_status';
    changed = true;
  });

  if (changed) saveAppointments(rows);

  const noShowByClient = {};
  getAppointments().forEach((a) => {
    if (a.status !== 'no_show') return;
    noShowByClient[a.client_email] = (noShowByClient[a.client_email] || 0) + 1;
  });

  Object.entries(noShowByClient).forEach(([email, total]) => {
    if (total < limit) return;
    const blockedUntil = addMinutes(new Date(), blockDays * 24 * 60).toISOString();
    setUserBlockedUntil(email, blockedUntil);
  });
}

function checkOverduePrepayments() {
  const now = new Date();
  const rows = getAppointments();
  let changed = false;
  rows.forEach((a) => {
    if (a.status === 'awaiting_payment' && a.payment_due_at && new Date(a.payment_due_at) < now) {
      a.status = 'canceled';
      a.updated_at = nowIso();
      a.updated_by = 'system_auto';
      changed = true;
      scheduleNotification({ user_id: a.client_email, type: 'cancellation', scheduled_for: nowIso(), sent_at: null, related_appointment_id: a.id });
      logAudit('appointment_auto_canceled_due_payment_timeout', { appointment_id: a.id });
    }
  });
  if (changed) saveAppointments(rows);
}

function createAppointmentFromBooking() {
  const session = getSession();
  const booking = getBooking();
  const blockedUntil = getUserBlockedUntil(session?.email || "");
  if (blockedUntil && new Date(blockedUntil) > new Date()) return null;
  const service = getServiceById(booking.service);
  if (!service) return null;
  const barbers = getBarbers(true);

  let barberId = booking.professional;
  const isKnownBarber = barbers.some((b) => b.id === barberId);
  if (barberId === 'sem-preferencia' || !isKnownBarber) {
    const candidate = barbers.find((b) => isSlotAvailable({ barberId: b.id, date: booking.date, time: booking.time, serviceDuration: service.duration_minutes }));
    barberId = candidate?.id;
  }
  if (!barberId) return null;

  const lockName = `appointment:${APP_CONFIG.tenantId}:${APP_CONFIG.unitId}:${barberId}:${booking.date}:${booking.time}`;
  if (!acquireLock(lockName)) return null;

  try {
    if (!isSlotAvailable({ barberId, date: booking.date, time: booking.time, serviceDuration: service.duration_minutes, editingAppointmentId: booking.edit_appointment_id || null })) return null;

    const start = toDate(booking.date, booking.time);
    const end = addMinutes(start, service.duration_minutes);
    const city = BASE_DATA.cities.find((c) => c.id === booking.city);
    const branch = city?.branches.find((b) => b.id === booking.branch);
    const barber = barbers.find((b) => b.id === barberId);
    const settings = getUnitSettings();
    const prepaymentOn = settings.prepayment_enabled && service.requires_pre_payment;

    return {
      id: booking.edit_appointment_id || `apt_${Date.now()}`,
      unit_id: APP_CONFIG.unitId,
      tenant_id: APP_CONFIG.tenantId,
      client_email: session?.email,
      client_name: session?.name,
      service_id: service.id,
      service_name: service.name,
      service_price: service.price,
      duration_minutes: service.duration_minutes,
      barber_id: barberId,
      barber_name: barber?.name || 'Sem preferência',
      city: city?.name,
      branch: branch?.name,
      address: branch?.address,
      appointment_date: booking.date,
      start_time: booking.time,
      end_time: end.toTimeString().slice(0, 5),
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      status: prepaymentOn ? 'awaiting_payment' : 'pending',
      requires_pre_payment: prepaymentOn,
      payment_due_at: prepaymentOn ? addMinutes(new Date(), 30).toISOString() : null,
      created_at: nowIso(),
      updated_at: nowIso(),
      created_by: session?.email || 'system',
      updated_by: session?.email || 'system',
      idempotency_key: `idem:${APP_CONFIG.tenantId}:${APP_CONFIG.unitId}:${session?.email || 'anon'}:${booking.date}:${booking.time}:${service.id}:${barberId}`
    };
  } finally {
    releaseLock(lockName);
  }
}


function canTransitionAppointmentStatus(from, to) {
  if (from === to) return true;
  return (APPOINTMENT_TRANSITIONS[from] || []).includes(to);
}

function deriveAutoStatus(currentStatus, startDatetime, wasPaid) {
  if (!['pending', 'confirmed'].includes(currentStatus)) return currentStatus;
  if (new Date(startDatetime) > new Date()) return currentStatus;
  if (currentStatus === 'confirmed') return wasPaid ? 'completed' : 'no_show';
  return 'no_show';
}

async function validateSlotServerSide(payload) {
  try {
    const res = await fetch('/api/appointments/validate-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    return { ok: !!data.valid, reason: data.reason || null };
  } catch {
    return { ok: false, reason: 'validation_unreachable' };
  }
}

async function createAppointmentServerSide(appointment) {
  try {
    const res = await fetch('/api/appointments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotency_key: appointment.idempotency_key,
        tenant_id: appointment.tenant_id,
        unit_id: appointment.unit_id,
        barber_id: appointment.barber_id,
        client_id: appointment.client_id || null,
        service_id: appointment.service_id,
        start_datetime: appointment.start_datetime,
        end_datetime: appointment.end_datetime,
        status: appointment.status,
        requires_pre_payment: appointment.requires_pre_payment,
        payment_due_at: appointment.payment_due_at
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) return { ok: false, reason: data?.reason || data?.error || 'create_failed' };
    return { ok: true, appointment: data?.appointment || null };
  } catch {
    return { ok: false, reason: 'create_unreachable' };
  }
}

function isTechnicalValidationReason(reason) {
  return !reason || ['server_validation', 'validation_unreachable', 'validation_failed'].includes(reason);
}

function isHardBusinessCreateReason(reason) {
  return [
    'appointment_overlap',
    'blocked_slot_conflict',
    'client_blocked',
    'subscription_inactive',
    'invalid_datetime_range',
    'invalid_initial_status',
    'missing_idempotency_key',
    'missing_tenant_or_unit',
    'missing_barber_id',
    'missing_datetimes'
  ].includes(reason);
}

function updateAppointmentStatus(id, status) {
  if (!APPOINTMENT_STATUS.includes(status)) return;
  const rows = getAppointments();
  const idx = rows.findIndex((a) => a.id === id);
  if (idx < 0) return;

  const beforeState = { ...rows[idx] };
  if (!canTransitionAppointmentStatus(rows[idx].status, status)) return;
  rows[idx].status = status;
  rows[idx].updated_at = nowIso();
  rows[idx].updated_by = getSession()?.email || 'system';

  if (status === 'canceled') {
    const removed = rows.splice(idx, 1)[0];
    saveAppointments(rows);
    invalidateDashboardCache('appointment_canceled');
    logAudit('appointment_deleted_after_cancel', { appointment_id: removed?.id, before_state: beforeState });
    return;
  }

  saveAppointments(rows);
  logAudit('appointment_status_changed', { appointment_id: id, status, before_state: beforeState, after_state: rows[idx] });

  if (status === 'confirmed') {
    scheduleNotification({ user_id: rows[idx].client_email, type: 'confirmation', scheduled_for: nowIso(), sent_at: nowIso(), related_appointment_id: id });
    scheduleNotification({ user_id: rows[idx].client_email, type: 'reminder', scheduled_for: addMinutes(new Date(rows[idx].start_datetime), -60).toISOString(), sent_at: null, related_appointment_id: id });
  }

  if (status === 'completed') {
    finalizeAppointmentTransaction(rows[idx]);
    invalidateDashboardCache('appointment_completed');
  }

}

function finalizeAppointmentTransaction(appointment) {
  withTransaction(
    () => {
      registerPaymentAndCommission(appointment);
      registerSubscriptionUsage(appointment);
      consumeStockForService(appointment);
    },
    {
      snapshot: () => ({
        payments: getJson(STORAGE_KEYS.payments, []),
        commissions: getJson(STORAGE_KEYS.commissions, []),
        products: getJson(STORAGE_KEYS.products, []),
        productMovements: getJson(STORAGE_KEYS.productMovements, []),
        subscriptions: getJson(STORAGE_KEYS.subscriptions, []),
        subscriptionUsage: getJson(STORAGE_KEYS.subscriptionUsage, [])
      }),
      restore: (snapshot) => {
        setJson(STORAGE_KEYS.payments, snapshot.payments);
        setJson(STORAGE_KEYS.commissions, snapshot.commissions);
        setJson(STORAGE_KEYS.products, snapshot.products);
        setJson(STORAGE_KEYS.productMovements, snapshot.productMovements);
        setJson(STORAGE_KEYS.subscriptions, snapshot.subscriptions);
        setJson(STORAGE_KEYS.subscriptionUsage, snapshot.subscriptionUsage);
        logAudit('appointment_finalize_rollback', { appointment_id: appointment.id });
      }
    }
  );
}

function registerPaymentAndCommission(appointment) {
  const payments = getJson(STORAGE_KEYS.payments, []);
  const commissions = getJson(STORAGE_KEYS.commissions, []);

  if (!payments.some((p) => p.appointment_id === appointment.id)) {
    payments.unshift({ id: `pay_${Date.now()}`, unit_id: appointment.unit_id, appointment_id: appointment.id, payment_method: 'pix', amount: appointment.service_price, paid_at: nowIso(), status: 'paid', created_at: nowIso(), updated_at: nowIso() });
  }

  const barber = getBarbers().find((b) => b.id === appointment.barber_id);
  const pct = barber?.commission_percentage || 0;
  const commissionAmount = Number(((appointment.service_price * pct) / 100).toFixed(2));

  if (!commissions.some((c) => c.appointment_id === appointment.id)) {
    commissions.unshift({ id: `com_${Date.now()}`, unit_id: appointment.unit_id, barber_id: appointment.barber_id, appointment_id: appointment.id, commission_amount: commissionAmount, calculated_at: nowIso(), created_at: nowIso(), updated_at: nowIso() });
  }

  setJson(STORAGE_KEYS.payments, payments);
  setJson(STORAGE_KEYS.commissions, commissions);
  invalidateDashboardCache('payment_created');
}



function consumeStockForService(appointment) {
  const map = BASE_DATA.serviceProducts.filter((r) => r.service_id === appointment.service_id);
  if (!map.length) return;

  const products = getProducts();
  const movements = getProductMovements();

  map.forEach((item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) return;
    product.quantity = Math.max(0, Number(product.quantity) - Number(item.quantity));
    product.updated_at = nowIso();
    movements.unshift({ id: `mov_${Date.now()}_${item.product_id}`, unit_id: APP_CONFIG.unitId, product_id: item.product_id, type: 'out', quantity: item.quantity, reason: 'service_consumption', related_appointment_id: appointment.id, created_at: nowIso(), updated_at: nowIso() });
  });

  saveProducts(products);
  saveProductMovements(movements);
}

function getAnalytics() {
  return getCached('analytics', () => {
  const appointments = getAppointments();
  const payments = getJson(STORAGE_KEYS.payments, []).filter((p) => p.unit_id === APP_CONFIG.unitId && p.status === 'paid');

  const heatmap = {};
  appointments.forEach((a) => {
    const day = new Date(a.start_datetime).toLocaleDateString('pt-BR', { weekday: 'short' });
    const key = `${day} ${a.start_time}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  });

  const byHourRevenue = {};
  completed.forEach((a) => {
    byHourRevenue[a.start_time] = (byHourRevenue[a.start_time] || 0) + Number(a.service_price || 0);
  });

  const byWeekDayRevenue = {};
  completed.forEach((a) => {
    const day = new Date(a.start_datetime).toLocaleDateString('pt-BR', { weekday: 'long' });
    byWeekDayRevenue[day] = (byWeekDayRevenue[day] || 0) + Number(a.service_price || 0);
  });

  const byClientFreq = {};
  appointments.forEach((a) => {
    byClientFreq[a.client_email] = (byClientFreq[a.client_email] || 0) + 1;
  });

  const byBarberOccupancy = {};
  const today = new Date().toISOString().slice(0, 10);
  getBarbers(true).forEach((b) => {
    const count = appointments.filter((a) => a.barber_id === b.id && a.appointment_date === today).length;
    byBarberOccupancy[b.name] = count;
  });

  return {
    heatmap,
    profitableHour: Object.entries(byHourRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
    bestWeekDay: Object.entries(byWeekDayRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
    topClient: Object.entries(byClientFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
    occupancyByBarber: byBarberOccupancy,
    paidTotal: payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  };
  });
}

function getDashboardMetrics() {
  return getCached('dashboardMetrics', () => {
  const appointments = getAppointments();
  const payments = getJson(STORAGE_KEYS.payments, []).filter((p) => p.unit_id === APP_CONFIG.unitId && p.status === 'paid');
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((a) => a.appointment_date === today);
  const todayCompletedAppointments = todayAppointments.filter((a) => a.status === 'completed');
  const todayPayments = payments.filter((p) => (p.paid_at || '').slice(0, 10) === today);

  const byHour = {};
  todayAppointments.forEach((a) => {
    byHour[a.start_time] = (byHour[a.start_time] || 0) + 1;
  });

  const byService = {};
  appointments.filter((a) => a.status === 'completed').forEach((a) => {
    byService[a.service_name] = (byService[a.service_name] || 0) + 1;
  });

  return {
    totalToday: todayAppointments.length,
    completedToday: todayCompletedAppointments.length,
    completedRevenueToday: todayCompletedAppointments.reduce((sum, a) => sum + Number(a.service_price || 0), 0),
    revenueToday: todayPayments.reduce((s, p) => s + Number(p.amount || 0), 0),
    busiestHour: Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
    topService: Object.entries(byService).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
  };
  });
}

function renderMetrics(container, metrics) {
  const metricIcon = {
    calendar: '<span class="admin-kpi-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path></svg></span>',
    wallet: '<span class="admin-kpi-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"></path><path d="M16 12h.01"></path><path d="M6 7V5a2 2 0 0 1 2-2h9"></path></svg></span>',
    clock: '<span class="admin-kpi-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg></span>',
    spark: '<span class="admin-kpi-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z"></path><path d="M5 16l.9 2.1L8 19l-2.1.9L5 22l-.9-2.1L2 19l2.1-.9L5 16Z"></path><path d="M19 14l.7 1.5L21 16l-1.3.6L19 18l-.7-1.4L17 16l1.3-.5L19 14Z"></path></svg></span>'
  };

  container.innerHTML = `
    <article class="admin-kpi-card">
      <div class="admin-kpi-top">${metricIcon.calendar}<p>Concluídos hoje</p></div>
      <h3>${asCurrency(metrics.completedRevenueToday || 0)}</h3>
      <small>${Number(metrics.completedToday || 0)} concluídos no dia</small>
    </article>
    <article class="admin-kpi-card">
      <div class="admin-kpi-top">${metricIcon.wallet}<p>Faturamento do dia</p></div>
      <h3>${asCurrency(metrics.revenueToday)}</h3>
      <small>Entradas confirmadas</small>
    </article>
    <article class="admin-kpi-card">
      <div class="admin-kpi-top">${metricIcon.clock}<p>Horário mais movimentado</p></div>
      <h3>${metrics.busiestHour}</h3>
      <small>Pico de demanda</small>
    </article>
    <article class="admin-kpi-card">
      <div class="admin-kpi-top">${metricIcon.spark}<p>Serviço mais vendido</p></div>
      <h3>${metrics.topService}</h3>
      <small>Produto líder do dia</small>
    </article>
  `;
}

function getLegacyLoginHints() {
  const platformHints = getPlatformUsers()
    .filter((u) => u && u.role !== 'super_admin')
    .map((u) => ({
      email: String(u.email || '').trim().toLowerCase(),
      role: String(u.role || '').trim().toLowerCase()
    }));

  const barberHints = getBarbers()
    .filter((b) => b && b.active && b.email)
    .map((b) => ({
      email: String(b.email || '').trim().toLowerCase(),
      role: 'barber'
    }));

  const byEmail = new Map();
  [...platformHints, ...barberHints].forEach((item) => {
    if (!item.email || byEmail.has(item.email)) return;
    byEmail.set(item.email, item);
  });
  return Array.from(byEmail.values()).sort((a, b) => a.email.localeCompare(b.email));
}

function roleHintLabel(role) {
  if (role === 'admin') return 'Admin';
  if (role === 'barber') return 'Barbeiro';
  if (role === 'client') return 'Cliente';
  return 'Usuario';
}

function renderLegacyLoginHints() {
  const root = document.getElementById('legacy-login-hints');
  if (!root) return;
  const hints = getLegacyLoginHints();
  if (!hints.length) {
    root.innerHTML = '';
    return;
  }

  root.innerHTML = `
    <div class="rounded-xl border border-borderc/80 bg-slate-950/40 p-3 grid gap-2">
      <p class="text-xs uppercase tracking-wide text-text-secondary font-semibold">Dicas de login (sem SuperAdmin)</p>
      <div class="grid gap-1.5">
        ${hints.map((item) => `
          <div class="flex items-center justify-between gap-2 rounded-lg border border-borderc/70 bg-slate-900/40 px-2 py-1.5">
            <span class="text-xs text-text-secondary truncate">${item.email}</span>
            <span class="text-[10px] uppercase tracking-wide rounded-full border border-borderc/80 px-2 py-0.5 text-text-secondary">${roleHintLabel(item.role)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function initLoginPage() {
  const form = document.querySelector('form.auth-form');
  if (!form) return;
  const feedback = document.getElementById('login-feedback');
  renderLegacyLoginHints();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailRaw = document.getElementById('email')?.value || '';
    const passwordRaw = document.getElementById('password')?.value || '';
    const email = normalizeCredential(emailRaw).toLowerCase();
    const password = normalizeCredential(passwordRaw);

    const base = getPlatformUsers().find((u) => normalizeCredential(u.email).toLowerCase() === email && normalizeCredential(u.password) === password);
    const barber = getBarbers().find((b) => normalizeCredential(b.email).toLowerCase() === email && normalizeCredential(b.password) === password && b.active);

    const user = base || (barber ? { email: barber.email, password: barber.password, role: 'barber', name: barber.name, barberId: barber.id, unit_id: barber.unit_id } : null);

    if (!user) {
      if (feedback) feedback.textContent = 'Credenciais inválidas.';
      return;
    }

    if (user.role === 'super_admin') {
      if (feedback) feedback.textContent = 'Use o acesso exclusivo do administrador da plataforma.';
      return;
    }

    if (user.role === 'admin') {
      const shop = getBarbershops().find((s) => s.email.toLowerCase() === user.email.toLowerCase() || s.id === user.unit_id);
      if (shop && ['suspended', 'disabled'].includes(shop.status)) {
        if (feedback) feedback.textContent = shop.status === 'suspended' ? 'Acesso desta barbearia está suspenso.' : 'Acesso desta barbearia está desativado.';
        return;
      }
    }

    setSession(user);
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect) return (window.location.href = redirect);

    if (user.role === 'client') window.location.href = 'client-home.html';
    else if (user.role === 'barber') window.location.href = 'barber-home.html';
    else if (user.role === 'super_admin') window.location.href = 'super-admin-tenants.html';
    else window.location.href = 'admin-home.html';
  });
}

function initSuperAdminLoginPage() {
  const form = document.getElementById('superadmin-login-form');
  if (!form) return;
  const feedback = document.getElementById('superadmin-login-feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailRaw = document.getElementById('superadmin-email')?.value || '';
    const passwordRaw = document.getElementById('superadmin-password')?.value || '';
    const email = normalizeCredential(emailRaw).toLowerCase();
    const password = normalizeCredential(passwordRaw);

    const user = getPlatformUsers().find((u) => u.role === 'super_admin' && normalizeCredential(u.email).toLowerCase() === email && normalizeCredential(u.password) === password);
    if (!user) {
      if (feedback) feedback.textContent = 'Credenciais do SuperAdmin inválidas.';
      return;
    }

    setSession(user);
    window.location.href = 'super-admin-tenants.html';
  });
}

function initLocationPage() {
  const form = document.getElementById('location-form');
  if (!form) return;
  const cityEl = document.getElementById('city');
  const branchEl = document.getElementById('branch');
  const b = ensureBookingConsistency();

  populateSelect(cityEl, BASE_DATA.cities, 'Selecione a cidade');

  const isEditMode = new URLSearchParams(window.location.search).get('edit') === 'location';

  cityEl.addEventListener('change', () => {
    const city = BASE_DATA.cities.find((c) => c.id === cityEl.value);
    branchEl.disabled = !city;
    populateSelect(branchEl, city ? city.branches : [], 'Selecione a unidade');
    if (isEditMode) saveBooking({ city: cityEl.value, branch: '' });
    else saveBooking({ city: cityEl.value, branch: '', service: '', professional: '', date: '', time: '', edit_appointment_id: null });
  });
  branchEl.addEventListener('change', () => {
    if (isEditMode) saveBooking({ branch: branchEl.value });
    else saveBooking({ branch: branchEl.value, service: '', professional: '', date: '', time: '', edit_appointment_id: null });
  });

  if (b.city) {
    cityEl.value = b.city;
    cityEl.dispatchEvent(new Event('change'));
    if (b.branch) branchEl.value = b.branch;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cityEl.value || !branchEl.value) return;
    saveBooking({ city: cityEl.value, branch: branchEl.value });
    window.location.href = isEditMode ? 'booking-review.html' : 'booking-service.html';
  });
}

function initServicePage() {
  const grid = document.getElementById('services-grid');
  const nextBtn = document.getElementById('service-next');
  if (!grid || !nextBtn) return;
  const b = ensureBookingConsistency();
  if (!b.city || !b.branch) return (window.location.href = 'booking-location.html');
  const isEditMode = new URLSearchParams(window.location.search).get('edit') === 'service';

  getServices().forEach((s) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `service-card ${b.service === s.id ? 'active' : ''}`;
    card.innerHTML = `<span class="service-bg">${s.emoji}</span><span class="service-title">${s.name}</span><span class="service-price">${asCurrency(s.price)} · ${s.duration_minutes} min</span>`;
    card.addEventListener('click', () => {
      if (isEditMode) saveBooking({ service: s.id });
      else saveBooking({ service: s.id, professional: '', date: '', time: '' });
      [...grid.querySelectorAll('.service-card')].forEach((x) => x.classList.remove('active'));
      card.classList.add('active');
      nextBtn.disabled = false;
    });
    grid.appendChild(card);
  });

  nextBtn.disabled = !b.service;
  nextBtn.addEventListener('click', () => {
    if (!getBooking().service) return;
    window.location.href = isEditMode ? 'booking-review.html' : 'booking-professional.html';
  });
}

function initProfessionalPage() {
  const grid = document.getElementById('professionals-grid');
  const nextBtn = document.getElementById('professional-next');
  if (!grid || !nextBtn) return;
  const b = ensureBookingConsistency();
  if (!b.service) return (window.location.href = 'booking-service.html');
  const isEditMode = new URLSearchParams(window.location.search).get('edit') === 'professional';

  const pros = [...getBarbers(true), { id: 'sem-preferencia', name: 'Sem preferência', avatar: '⭐' }];
  pros.forEach((p) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `pro-card ${b.professional === p.id ? 'active' : ''}`;
    card.innerHTML = `<span class="pro-avatar">${p.avatar}</span><span class="pro-name">${p.name}</span>`;
    card.addEventListener('click', () => {
      if (isEditMode) saveBooking({ professional: p.id });
      else saveBooking({ professional: p.id, date: '', time: '' });
      [...grid.querySelectorAll('.pro-card')].forEach((x) => x.classList.remove('active'));
      card.classList.add('active');
      nextBtn.disabled = false;
    });
    grid.appendChild(card);
  });

  nextBtn.disabled = !b.professional;
  nextBtn.addEventListener('click', () => {
    if (!getBooking().professional) return;
    window.location.href = isEditMode ? 'booking-review.html' : 'booking-datetime.html';
  });
}

function initDatetimePage() {
  const form = document.getElementById('datetime-form');
  if (!form) return;
  const dateEl = document.getElementById('date');
  const grid = document.getElementById('time-grid');
  const button = document.getElementById('confirm-booking');

  const b = ensureBookingConsistency();
  if (!b.professional || !b.service) return (window.location.href = 'booking-professional.html');
  const service = getServiceById(b.service);
  const summaryServiceEl = document.getElementById('summary-service');
  const summaryPriceEl = document.getElementById('summary-price');
  const summaryLocationEl = document.getElementById('summary-location');
  const summaryProfessionalEl = document.getElementById('summary-professional');
  const summaryTimeEl = document.getElementById('summary-time');

  populateSelect(dateEl, getNextDays(), 'Selecione uma data');
  if (b.date) dateEl.value = b.date;

  function renderSummary() {
    const cur = getBooking();
    const city = BASE_DATA.cities.find((c) => c.id === cur.city);
    const branch = city?.branches.find((x) => x.id === cur.branch);
    const selectedService = getServiceById(cur.service);
    const selectedProfessional = cur.professional === 'sem-preferencia' ? { name: 'Sem preferência' } : getBarbers().find((x) => x.id === cur.professional);
    if (summaryServiceEl) summaryServiceEl.textContent = `Serviço: ${selectedService?.name || '-'}`;
    if (summaryPriceEl) summaryPriceEl.textContent = `Valor a partir de: ${asCurrency(selectedService?.price || 0)}`;
    if (summaryLocationEl) summaryLocationEl.textContent = `Local: ${branch?.name || '-'}`;
    if (summaryProfessionalEl) summaryProfessionalEl.textContent = `Profissional: ${selectedProfessional?.name || '-'}`;
    if (summaryTimeEl) summaryTimeEl.textContent = `Horário: ${cur.time || '-'}`;
  }

  function render() {
    const cur = getBooking();
    grid.innerHTML = '';

    getTimeslots().forEach((time) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `time-slot ${cur.time === time ? 'active' : ''}`;
      btn.textContent = time;

      let available = false;
      if (cur.date) {
        if (cur.professional === 'sem-preferencia') {
          available = getBarbers(true).some((barber) => isSlotAvailable({ barberId: barber.id, date: cur.date, time, serviceDuration: service.duration_minutes }));
        } else {
          available = isSlotAvailable({ barberId: cur.professional, date: cur.date, time, serviceDuration: service.duration_minutes });
        }
      }

      btn.disabled = !available;
      btn.addEventListener('click', () => {
        saveBooking({ time });
        render();
        button.disabled = !(getBooking().date && getBooking().time);
      });

      grid.appendChild(btn);
    });
    renderSummary();
  }

  dateEl.addEventListener('change', () => {
    saveBooking({ date: dateEl.value, time: '' });
    render();
    button.disabled = true;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!getBooking().date || !getBooking().time) return;
    window.location.href = 'booking-review.html';
  });

  render();
  button.disabled = !(getBooking().date && getBooking().time);
}

function initBookingReviewPage() {
  const list = document.getElementById('review-list');
  const action = document.getElementById('review-action');
  if (!list || !action) return;
  const b = getBooking();
  if (!(b.city && b.branch && b.service && b.professional && b.date && b.time)) return (window.location.href = 'booking-location.html');

  const city = BASE_DATA.cities.find((c) => c.id === b.city);
  const branch = city?.branches.find((x) => x.id === b.branch);
  const service = getServiceById(b.service);
  const barber = [...getBarbers(true), { id: 'sem-preferencia', name: 'Sem preferência' }].find((x) => x.id === b.professional);

  list.innerHTML = [
    ['🌍', city?.name, 'Região', 'booking-location.html?edit=location'],
    ['📍', branch?.name, 'Unidade', 'booking-location.html?edit=location'],
    ['💈', `${service?.name} (${service?.duration_minutes} min)`, 'Serviço', 'booking-service.html?edit=service'],
    ['👤', barber?.name, 'Profissional', 'booking-professional.html?edit=professional'],
    ['📅', formatBookingDateTime(b.date, b.time), 'Data e hora', 'booking-datetime.html?edit=datetime']
  ]
    .map((row) => `<article class="review-item"><div class="review-icon">${row[0]}</div><div><h3>${row[1] || '-'}</h3><p>${row[2]}</p></div><a class="review-edit" href="${row[3]}">Alterar</a></article>`)
    .join('');

  document.getElementById('review-price').textContent = `A partir de ${asCurrency(service?.price || 0)}`;
  document.getElementById('review-address').textContent = branch?.address || '-';
  const noPrefNotice = document.getElementById('review-no-preference');
  const feedback = document.getElementById('review-feedback');
  if (noPrefNotice) noPrefNotice.style.display = b.professional === 'sem-preferencia' ? 'block' : 'none';

  const session = getSession();
  if (!session) {
    action.textContent = 'Efetuar login para continuar';
    action.disabled = false;
  } else if (!hasRole('client')) {
    action.textContent = 'Perfil administrativo não agenda por esta tela';
    action.disabled = true;
  } else if (!canClientBook(session.email)) {
    action.textContent = 'Cliente bloqueado temporariamente';
    action.disabled = true;
  } else {
    action.textContent = 'Confirmar agendamento';
    action.disabled = false;
  }

  const successModal = document.getElementById('booking-success-modal');
  const successHomeBtn = document.getElementById('booking-success-home');

  action.addEventListener('click', async () => {
    const currentSession = getSession();
    if (!currentSession) return (window.location.href = 'login.html?redirect=booking-review.html');
    if (!hasRole('client')) return;
    if (!canClientBook(currentSession.email)) return;

    const apt = createAppointmentFromBooking();
    if (!apt) {
      if (feedback) feedback.textContent = 'Horário indisponível ou dados inválidos. Volte e selecione outro horário/profissional.';
      action.textContent = 'Horário indisponível. Escolha outro.';
      return;
    }

    const bookingSnapshot = getBooking();
    const validation = await validateSlotServerSide({
      tenant_id: APP_CONFIG.tenantId,
      unit_id: APP_CONFIG.unitId,
      barber_id: apt.barber_id,
      start_datetime: apt.start_datetime,
      duration_minutes: Number(apt.duration_minutes || 0),
      editing_appointment_id: bookingSnapshot.edit_appointment_id || null
    });
    if (!validation.ok) {
      if (!isTechnicalValidationReason(validation.reason)) {
        if (feedback) feedback.textContent = `Horário indisponível (${validation.reason || 'server_validation'}).`;
        action.textContent = 'Horário indisponível. Escolha outro.';
        return;
      }
      if (feedback) feedback.textContent = 'Validação do servidor indisponível no momento. Tentando concluir mesmo assim.';
    }

    const serverCreation = await createAppointmentServerSide(apt);
    if (!serverCreation.ok) {
      if (isHardBusinessCreateReason(serverCreation.reason)) {
        if (feedback) feedback.textContent = `Horário indisponível (${serverCreation.reason}).`;
        action.textContent = 'Horário indisponível. Escolha outro.';
        return;
      }
      if (feedback) feedback.textContent = `Agendamento salvo localmente. Falha na sincronização com servidor (${serverCreation.reason}).`;
    } else {
      logAudit('appointment_server_synced', { appointment_id: apt.id, server_appointment_id: serverCreation.appointment?.id || null });
    }

    const rows = getAppointments();
    const duplicated = rows.find((r) => r.idempotency_key && r.idempotency_key === apt.idempotency_key);
    if (duplicated) {
      if (feedback) feedback.textContent = 'Agendamento já confirmado anteriormente para este horário.';
      action.disabled = true;
      return;
    }
    const editId = getBooking().edit_appointment_id;
    const existingIdx = editId ? rows.findIndex((r) => r.id === editId) : -1;

    if (existingIdx >= 0) {
      rows[existingIdx] = {
        ...rows[existingIdx],
        ...apt,
        id: rows[existingIdx].id,
        status: 'confirmed',
        updated_at: nowIso(),
        updated_by: currentSession.email
      };
      saveAppointments(rows);
      logAudit('appointment_rescheduled', { appointment_id: rows[existingIdx].id });
    } else {
      rows.unshift(apt);
      saveAppointments(rows);
      logAudit('appointment_created', { appointment_id: apt.id, status: apt.status });

      if (apt.status === 'awaiting_payment') {
        action.textContent = 'Aguardando pagamento antecipado';
      }
      updateAppointmentStatus(apt.id, 'confirmed');
    }

    action.disabled = true;
    if (feedback) feedback.textContent = 'Agendamento concluído com sucesso!';

    if (successModal) {
      successModal.classList.remove('hidden');
      successModal.classList.add('is-open');
      successModal.setAttribute('aria-hidden', 'false');
    }

    if (successHomeBtn) {
      successHomeBtn.onclick = () => {
        if (successModal) {
          successModal.classList.remove('is-open');
          successModal.classList.add('hidden');
          successModal.setAttribute('aria-hidden', 'true');
        }
        resetBooking();
        window.location.href = 'client-home.html';
      };
    }
  });
}

function canCancelAppointment(appointment) {
  if (TEST_MODE_ALLOW_ANY_CANCELLATION) return true;
  const settings = getUnitSettings();
  const diffHours = (new Date(appointment.start_datetime) - new Date()) / 3600000;
  return diffHours >= Number(settings.cancellation_limit_hours || 3);
}

function initMySchedulesPage() {
  const root = document.getElementById('my-schedules-content');
  if (!root) return;

  const session = getSession();

  if (!session) {
    root.innerHTML = '<div class="empty-state"><h2>Faça login para ver seus horários</h2><p>Você precisa entrar com sua conta para acessar os horários agendados.</p><a class="button button-primary" href="login.html?redirect=my-schedules.html">Efetuar login</a></div>';
    return;
  }

  if (!hasRole('client')) {
    root.innerHTML = '<div class="empty-state"><h2>Área exclusiva de clientes</h2></div>';
    return;
  }

  const appointments = getAppointments().filter((a) => a.client_email === session.email);
  if (!appointments.length) {
    root.innerHTML = '<div class="empty-state"><h2>Você não tem horários agendados</h2><p>Quando confirmar um agendamento ele aparecerá aqui.</p><a class="button button-primary" href="booking-location.html">Agendar agora</a></div>';
    return;
  }

  root.innerHTML = appointments
    .map((a) => `<article class="schedule-item schedule-item-client"><h3>${a.service_name}</h3><p class="schedule-main-time">${formatBookingDateTime(a.appointment_date, a.start_time)}</p><p>Status: <span class="status-badge status-${a.status}">${getBookingStatusLabel(a.status)}</span></p><small>${a.barber_name} · ${a.branch}</small>${!['completed', 'canceled'].includes(a.status) ? `<div class="form-row"><button class="button button-secondary" data-reschedule="${a.id}">Remarcar</button><button class="button button-secondary" data-cancel="${a.id}">Cancelar</button></div>` : ''}</article>`)
    .join('');

  root.querySelectorAll('[data-reschedule]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const apt = appointments.find((a) => a.id === btn.dataset.reschedule);
      if (!apt || apt.status === 'completed') return;
      const city = BASE_DATA.cities.find((c) => c.name === apt.city);
      const branch = city?.branches.find((x) => x.name === apt.branch);
      saveBooking({ city: city?.id || 'poa', branch: branch?.id || 'bom-fim', service: apt.service_id, professional: apt.barber_id, date: apt.appointment_date, time: apt.start_time, edit_appointment_id: apt.id });
      window.location.href = 'booking-datetime.html?edit=datetime';
    });
  });

  root.querySelectorAll('[data-cancel]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const apt = appointments.find((a) => a.id === btn.dataset.cancel);
      if (!apt) return;
      const allowed = canCancelAppointment(apt);
      if (!allowed) {
        await alertAction('Cancelamento fora da política: prazo mínimo não respeitado.');
        return;
      }
      if (!(await confirmAction('Deseja realmente cancelar este agendamento?'))) return;
      updateAppointmentStatus(apt.id, 'canceled');
      scheduleNotification({ user_id: apt.client_email, type: 'cancellation', scheduled_for: nowIso(), sent_at: nowIso(), related_appointment_id: apt.id });
      initMySchedulesPage();
    });
  });
}

function renderAppointmentCard(a, canManage = false) {
  const actionButtons = canManage
    ? `<div class="form-row"><button class="button button-secondary" data-status="confirmed" data-id="${a.id}">Confirmar</button><button class="button button-secondary" data-status="completed" data-id="${a.id}">Concluir</button><button class="button button-secondary" data-status="canceled" data-id="${a.id}">Cancelar</button></div>`
    : '';
  return `<article class="schedule-item"><h3>${a.service_name} · ${formatBookingDateTime(a.appointment_date, a.start_time)}</h3><p>${a.barber_name} · ${a.client_name || 'Cliente'} · <span class="status-badge status-${a.status}">${getBookingStatusLabel(a.status)}</span></p><small>${a.branch} - ${a.city}</small>${actionButtons}</article>`;
}


function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    const line = headers.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(',');
    lines.push(line);
  });
  return lines.join('\n');
}

function downloadCsv(filename, rows) {
  const content = toCsv(rows);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function initAdminSchedulesPage() {
  const list = document.getElementById('admin-schedules-list');
  const barberFilter = document.getElementById('admin-professional-filter');
  const statusFilter = document.getElementById('admin-status-filter');
  const dateFilter = document.getElementById('admin-date-filter');
  if (!list || !barberFilter || !statusFilter) return;
  if (!requireRole(['admin', 'barber', 'super_admin'], 'login.html')) return;

  const session = getSession();
  const options = [{ id: 'all', name: 'Todos os barbeiros' }, ...getBarbers()];
  populateSelect(barberFilter, options, 'Todos os barbeiros');
  barberFilter.value = 'all';

  function filteredRows() {
    let rows = getAppointments();
    if (hasRole('barber')) {
      barberFilter.disabled = true;
      rows = rows.filter((a) => a.barber_id === session.barberId);
    } else {
      barberFilter.disabled = false;
      if (barberFilter.value !== 'all' && barberFilter.value) rows = rows.filter((a) => a.barber_id === barberFilter.value);
    }
    if (statusFilter.value !== 'all') rows = rows.filter((a) => a.status === statusFilter.value);
    if (dateFilter?.value) rows = rows.filter((a) => a.appointment_date === dateFilter.value);
    return rows;
  }

  function render() {
    const rows = filteredRows();
    if (!rows.length) {
      list.innerHTML = '<div class="empty-state"><h2>Sem agendamentos neste filtro</h2></div>';
      return;
    }
    const canManage = hasRole('admin', 'super_admin');
    list.innerHTML = rows.map((a) => renderAppointmentCard(a, canManage)).join('');
    if (canManage) {
      list.querySelectorAll('[data-status]').forEach((btn) => {
        btn.addEventListener('click', () => {
          updateAppointmentStatus(btn.dataset.id, btn.dataset.status);
          render();
        });
      });
    }
  }

  barberFilter.addEventListener('change', render);
  statusFilter.addEventListener('change', render);
  dateFilter?.addEventListener('change', render);
  render();
}

function initAdminBarbersPage() {
  const form = document.getElementById('barber-form');
  if (!form) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const idEl = document.getElementById('barber-id');
  const nameEl = document.getElementById('barber-name');
  const emailEl = document.getElementById('barber-email');
  const passwordEl = document.getElementById('barber-password');
  const commissionEl = document.getElementById('barber-commission');
  const activeEl = document.getElementById('barber-active');
  const cancelEl = document.getElementById('barber-cancel');
  const listEl = document.getElementById('barbers-list');

  function reset() {
    idEl.value = '';
    nameEl.value = '';
    emailEl.value = '';
    passwordEl.value = '';
    commissionEl.value = '40';
    activeEl.checked = true;
  }

  function render() {
    const rows = getBarbers();
    listEl.innerHTML = rows
      .map((b) => `<article class="schedule-item"><h3>${b.name}</h3><p>${b.email} · comissão ${b.commission_percentage}% · ${b.active ? 'ativo' : 'inativo'}</p><div class="form-row"><button class="button button-secondary" type="button" data-edit="${b.id}">Editar</button><button class="button button-secondary" type="button" data-delete="${b.id}">Excluir</button></div></article>`)
      .join('');

    listEl.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const b = rows.find((x) => x.id === btn.dataset.edit);
        if (!b) return;
        idEl.value = b.id;
        nameEl.value = b.name;
        emailEl.value = b.email;
        passwordEl.value = b.password;
        commissionEl.value = String(b.commission_percentage);
        activeEl.checked = !!b.active;
      });
    });

    listEl.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = rows.map((b) => (b.id === btn.dataset.delete ? { ...b, deleted_at: nowIso(), updated_at: nowIso(), active: false } : b));
        saveBarbers(next);
        logAudit('barber_soft_deleted', { barber_id: btn.dataset.delete });
        render();
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rows = getBarbers();
    const payload = {
      id: idEl.value || slugify(nameEl.value),
      name: sanitizeText(nameEl.value),
      email: sanitizeText(emailEl.value).toLowerCase(),
      password: sanitizeText(passwordEl.value),
      commission_percentage: Number(commissionEl.value || 0),
      active: activeEl.checked,
      unit_id: APP_CONFIG.unitId,
      avatar: '💈',
      updated_at: nowIso()
    };

    const duplicate = rows.some((r) => r.email.toLowerCase() === payload.email.toLowerCase() && r.id !== payload.id);
    if (duplicate) return;

    const idx = rows.findIndex((r) => r.id === payload.id);
    if (idx >= 0) rows[idx] = { ...rows[idx], ...payload };
    else rows.push({ ...payload, created_at: nowIso() });

    saveBarbers(rows);
    logAudit('barber_saved', { barber_id: payload.id });
    reset();
    render();
  });

  cancelEl.addEventListener('click', reset);
  render();
}

function initBlockedSlotsPage() {
  const form = document.getElementById('blocked-slot-form');
  const listEl = document.getElementById('blocked-slot-list');
  if (!form || !listEl) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const barberEl = document.getElementById('blocked-barber');
  const startEl = document.getElementById('blocked-start');
  const endEl = document.getElementById('blocked-end');
  const reasonEl = document.getElementById('blocked-reason');

  populateSelect(barberEl, getBarbers(true), 'Selecione o barbeiro');

  function render() {
    const rows = getBlockedSlots();
    if (!rows.length) {
      listEl.innerHTML = '<div class="empty-state"><h2>Sem bloqueios cadastrados</h2></div>';
      return;
    }
    listEl.innerHTML = rows
      .map((b) => `<article class="schedule-item"><h3>${b.barber_name}</h3><p>${new Date(b.start_datetime).toLocaleString('pt-BR')} até ${new Date(b.end_datetime).toLocaleString('pt-BR')}</p><small>${b.reason}</small><div class="form-row"><button class="button button-secondary" data-delete="${b.id}" type="button">Excluir bloqueio</button></div></article>`)
      .join('');

    listEl.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        saveBlockedSlots(getBlockedSlots().filter((b) => b.id !== btn.dataset.delete));
        logAudit('blocked_slot_deleted', { id: btn.dataset.delete });
        render();
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const barber = getBarbers().find((b) => b.id === barberEl.value);
    if (!barber) return;

    const start = new Date(startEl.value);
    const end = new Date(endEl.value);
    if (!(start < end)) return;

    const rows = getBlockedSlots();
    rows.unshift({ id: `blk_${Date.now()}`, unit_id: APP_CONFIG.unitId, barber_id: barber.id, barber_name: barber.name, start_datetime: start.toISOString(), end_datetime: end.toISOString(), reason: reasonEl.value.trim(), created_at: nowIso(), updated_at: nowIso() });
    saveBlockedSlots(rows);
    logAudit('blocked_slot_created', { barber_id: barber.id });
    form.reset();
    render();
  });

  render();
}

function initAdminFinancePage() {
  const metricsEl = document.getElementById('finance-metrics');
  const detailsEl = document.getElementById('finance-by-barber');
  const summaryEl = document.getElementById('finance-summary-note');
  const servicesEl = document.getElementById('finance-services');
  const paymentsEl = document.getElementById('finance-payment-status');
  const exportsEl = document.getElementById('finance-export-actions');
  const dailyEl = document.getElementById('finance-daily-performance');
  const periodButtons = Array.from(document.querySelectorAll('[data-finance-period]'));
  if (!metricsEl || !detailsEl) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const allAppointments = getAppointments().filter((a) => (a.unit_id || APP_CONFIG.unitId) === APP_CONFIG.unitId);
  const allPayments = getJson(STORAGE_KEYS.payments, []).filter((p) => p.unit_id === APP_CONFIG.unitId);

  if (exportsEl) {
    exportsEl.innerHTML = `
      <button class="button button-secondary" type="button" data-export="revenue">Exportar faturamento CSV</button>
      <button class="button button-secondary" type="button" data-export="commissions">Exportar comissoes CSV</button>
      <button class="button button-secondary" type="button" data-export="clients">Exportar clientes CSV</button>
      <button class="button button-secondary" type="button" data-export="stock">Exportar estoque CSV</button>
    `;
  }

  (exportsEl || document).querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.export;
      if (type === 'revenue') {
        const rows = getJson(STORAGE_KEYS.payments, [])
          .filter((p) => p.unit_id === APP_CONFIG.unitId)
          .map((p) => ({ paid_at: p.paid_at, amount: p.amount, status: p.status, appointment_id: p.appointment_id }));
        downloadCsv('faturamento-mensal.csv', rows);
      }
      if (type === 'commissions') {
        const rows = getJson(STORAGE_KEYS.commissions, [])
          .filter((c) => c.unit_id === APP_CONFIG.unitId)
          .map((c) => ({ barber_id: c.barber_id, appointment_id: c.appointment_id, commission_amount: c.commission_amount, calculated_at: c.calculated_at }));
        downloadCsv('comissoes-por-barbeiro.csv', rows);
      }
      if (type === 'clients') {
        const grouped = {};
        allAppointments.forEach((a) => {
          grouped[a.client_email] = (grouped[a.client_email] || 0) + 1;
        });
        const rows = Object.entries(grouped).map(([client_email, appointments]) => ({ client_email, appointments }));
        downloadCsv('clientes-ativos.csv', rows);
      }
      if (type === 'stock') {
        const rows = getProductMovements().map((m) => ({ product_id: m.product_id, type: m.type, quantity: m.quantity, reason: m.reason, created_at: m.created_at }));
        downloadCsv('movimentacao-estoque.csv', rows);
      }
    });
  });

  const rangeForPeriod = (period) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);

    if (period === 'today') {
      end.setDate(end.getDate() + 1);
      return { start, end, label: 'Hoje' };
    }

    if (period === 'week') {
      const day = start.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(start.getDate() - diffToMonday);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
      return { start, end, label: 'Semana' };
    }

    start.setDate(1);
    end.setMonth(start.getMonth() + 1);
    return { start, end, label: 'Mes' };
  };

  const inRange = (value, range) => {
    const d = new Date(value || 0);
    return Number.isFinite(d.getTime()) && d >= range.start && d < range.end;
  };

  const render = (period = 'today') => {
    const range = rangeForPeriod(period);
    const appointments = allAppointments.filter((a) => inRange(a.start_datetime, range));
    const paidPayments = allPayments.filter((p) => p.status === 'paid' && inRange(p.paid_at || p.created_at, range));

    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === 'completed');
    const canceled = appointments.filter((a) => a.status === 'canceled');
    const active = appointments.filter((a) => ['awaiting_payment', 'pending', 'confirmed'].includes(a.status));

    const revenue = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const avgTicket = completed.length ? revenue / completed.length : 0;
    const cancellationRate = total ? (canceled.length / total) * 100 : 0;
    const expectedRevenue = active.reduce((sum, a) => sum + Number(a.service_price || 0), 0);

    metricsEl.innerHTML = `
      <article class="finance-kpi-card"><h3>Faturamento</h3><p>${asCurrency(revenue)}</p><small>${range.label}</small></article>
      <article class="finance-kpi-card"><h3>Atendimentos concluidos</h3><p>${completed.length}</p><small>de ${total} agendamentos</small></article>
      <article class="finance-kpi-card"><h3>Ticket medio</h3><p>${asCurrency(avgTicket)}</p><small>por servico concluido</small></article>
      <article class="finance-kpi-card"><h3>Cancelamentos</h3><p>${cancellationRate.toFixed(0)}%</p><small>${canceled.length} no periodo</small></article>
      <article class="finance-kpi-card"><h3>Receita prevista</h3><p>${asCurrency(expectedRevenue)}</p><small>agendamentos em aberto</small></article>
      <article class="finance-kpi-card"><h3>Pagamentos aprovados</h3><p>${paidPayments.length}</p><small>transacoes pagas</small></article>
    `;

    if (summaryEl) {
      summaryEl.textContent = `Visao de ${range.label.toLowerCase()}: ${total} agendamentos, ${completed.length} concluidos e ${canceled.length} cancelados.`;
    }

    const byBarber = {};
    completed.forEach((a) => {
      const key = a.barber_name || 'Sem barbeiro';
      byBarber[key] = (byBarber[key] || 0) + Number(a.service_price || 0);
    });
    const barberRows = Object.entries(byBarber)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topBarberAmount = barberRows[0]?.[1] || 0;
    detailsEl.innerHTML = barberRows.length
      ? barberRows
        .map(([name, amount]) => `
          <article class="finance-list-card">
            <div class="finance-list-row"><h3>${name}</h3><strong>${asCurrency(amount)}</strong></div>
            <div class="finance-progress"><span style="width:${topBarberAmount ? Math.max(8, (amount / topBarberAmount) * 100) : 8}%"></span></div>
          </article>
        `)
        .join('')
      : '<article class="finance-list-card"><p>Sem faturamento por barbeiro neste periodo.</p></article>';

    const byService = {};
    completed.forEach((a) => {
      const key = a.service_name || 'Servico';
      byService[key] = (byService[key] || 0) + Number(a.service_price || 0);
    });
    const serviceRows = Object.entries(byService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topService = serviceRows[0]?.[1] || 0;
    if (servicesEl) {
      servicesEl.innerHTML = serviceRows.length
        ? serviceRows
          .map(([name, amount]) => `
            <article class="finance-list-card">
              <div class="finance-list-row"><h3>${name}</h3><strong>${asCurrency(amount)}</strong></div>
              <div class="finance-progress"><span style="width:${topService ? Math.max(8, (amount / topService) * 100) : 8}%"></span></div>
            </article>
          `)
          .join('')
        : '<article class="finance-list-card"><p>Sem receita por servico neste periodo.</p></article>';
    }

    if (paymentsEl) {
      const paymentGroups = allPayments
        .filter((p) => inRange(p.paid_at || p.created_at, range))
        .reduce((acc, p) => {
          const key = p.status || 'pending';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
      const statuses = ['paid', 'pending', 'failed', 'refunded'];
      paymentsEl.innerHTML = statuses
        .map((status) => `<article class="finance-status-card"><h3>${status}</h3><p>${paymentGroups[status] || 0}</p></article>`)
        .join('');
    }

    if (dailyEl) {
      const days = [];
      for (let d = new Date(range.start); d < range.end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
      const dayRows = days.map((day) => {
        const key = day.toISOString().slice(0, 10);
        const dayRevenue = paidPayments
          .filter((p) => (p.paid_at || p.created_at || '').slice(0, 10) === key)
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        return { key, label: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: dayRevenue };
      });
      const maxValue = Math.max(...dayRows.map((r) => r.value), 0);
      dailyEl.innerHTML = dayRows.length
        ? dayRows
          .map((row) => `
            <article class="finance-day-row">
              <span>${row.label}</span>
              <div class="finance-progress"><span style="width:${maxValue ? Math.max(6, (row.value / maxValue) * 100) : 6}%"></span></div>
              <strong>${asCurrency(row.value)}</strong>
            </article>
          `)
          .join('')
        : '<article class="finance-list-card"><p>Sem movimentacao diaria para exibir.</p></article>';
    }

    periodButtons.forEach((btn) => {
      const isActive = (btn.dataset.financePeriod || 'today') === period;
      btn.classList.toggle('button-primary', isActive);
      btn.classList.toggle('button-secondary', !isActive);
      btn.classList.toggle('opacity-80', !isActive);
    });
  };

  periodButtons.forEach((btn) => {
    btn.addEventListener('click', () => render(btn.dataset.financePeriod || 'today'));
  });

  render('today');
}

function initAdminDashboard() {
  const wrap = document.getElementById('admin-metrics');
  if (!wrap) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const unitLabel = document.getElementById('admin-unit-label');
  if (unitLabel) {
    const brand = getBrandSettings();
    unitLabel.textContent = brand?.shopName || APP_CONFIG.unitId || 'Unidade atual';
  }

  const metrics = getDashboardMetrics();
  renderMetrics(wrap, metrics);

  const lowStock = getProducts().filter((p) => Number(p.quantity) <= Number(p.minimum_stock));
  if (lowStock.length) {
    const alerts = lowStock.map((p) => `${p.name} (${p.quantity})`).join(', ');
    const alertCard = document.createElement('article');
    alertCard.className = 'admin-alert-card';
    alertCard.innerHTML = `<div class="admin-alert-head"><span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path></svg></span><h3>Alerta de estoque baixo</h3></div><p>${alerts}</p>`;
    wrap.appendChild(alertCard);
  }

  const appointmentsRoot = document.getElementById('admin-appointments-summary');
  const financeRoot = document.getElementById('admin-finance-summary');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const appointments = getAppointments();
  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.start_datetime);
    return d >= startOfToday && d < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  });
  const weekAppointments = appointments.filter((a) => {
    const d = new Date(a.start_datetime);
    return d >= startOfWeek && d < endOfWeek;
  });
  const dashboardQueueStatuses = ['pending', 'confirmed'];
  const todayQueueAppointments = todayAppointments.filter((a) => dashboardQueueStatuses.includes(a.status));
  const weekQueueAppointments = weekAppointments.filter((a) => dashboardQueueStatuses.includes(a.status));
  const queuePageSize = 3;
  let queuePage = 0;

  const renderAppointments = (queueRows, label) => {
    if (!appointmentsRoot) return;

    const sortedQueueRows = [...queueRows].sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
    const totalPages = Math.max(1, Math.ceil(sortedQueueRows.length / queuePageSize));
    queuePage = Math.max(0, Math.min(queuePage, totalPages - 1));
    const pageStart = queuePage * queuePageSize;
    const pageRows = sortedQueueRows.slice(pageStart, pageStart + queuePageSize);

    const queueList = pageRows
      .map((a) => `<article class="admin-list-item"><h3>${a.service_name}</h3><p>${formatBookingDateTime(a.appointment_date, a.start_time)}</p><small>${a.barber_name} · ${getBookingStatusLabel(a.status)}</small></article>`)
      .join('');

    const queueControls = sortedQueueRows.length > queuePageSize
      ? `
        <div class="mt-2 flex items-center justify-between gap-2">
          <button type="button" class="button button-secondary !min-h-10 !px-4 !text-xs md:!text-sm rounded-xl" data-queue-prev ${queuePage === 0 ? 'disabled' : ''}>Anterior</button>
          <small class="text-text-secondary">Parte ${queuePage + 1} de ${totalPages}</small>
          <button type="button" class="button button-primary !min-h-10 !px-4 !text-xs md:!text-sm rounded-xl" data-queue-next ${queuePage >= totalPages - 1 ? 'disabled' : ''}>Próximos 3</button>
        </div>
      `
      : '';

    appointmentsRoot.innerHTML = `
      <div class="grid gap-3">
        <article>
          <header class="admin-panel-head"><div><h3>Agendamentos na fila (${label})</h3><small>Somente pendentes e confirmados</small></div><span>${sortedQueueRows.length} registros</span></header>
          <div class="grid gap-2">${queueList || '<article class="admin-list-item"><p>Sem agendamentos na fila.</p></article>'}</div>
          ${queueControls}
        </article>
      </div>
    `;

    appointmentsRoot.querySelector('[data-queue-prev]')?.addEventListener('click', () => {
      queuePage = Math.max(0, queuePage - 1);
      renderAppointments(sortedQueueRows, label);
    });

    appointmentsRoot.querySelector('[data-queue-next]')?.addEventListener('click', () => {
      queuePage = Math.min(totalPages - 1, queuePage + 1);
      renderAppointments(sortedQueueRows, label);
    });
  };

  const payments = getJson(STORAGE_KEYS.payments, []).filter((p) => p.unit_id === APP_CONFIG.unitId && p.status === 'paid');
  const revenueToday = payments
    .filter((p) => {
      const d = new Date(p.paid_at || p.created_at || 0);
      return d >= startOfToday && d < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    })
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const revenueWeek = payments
    .filter((p) => {
      const d = new Date(p.paid_at || p.created_at || 0);
      return d >= startOfWeek && d < endOfWeek;
    })
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const renderFinance = (revenue, totalAppointments, label) => {
    if (!financeRoot) return;
    const avgTicket = totalAppointments ? revenue / totalAppointments : 0;
    financeRoot.innerHTML = `
      <header class="admin-panel-head"><div><h3>Resumo financeiro (${label})</h3><small>Atualizado agora</small></div><span>Performance</span></header>
      <div class="grid gap-2 md:grid-cols-2">
        <article class="admin-list-item"><h3>Faturamento</h3><p>${asCurrency(revenue)}</p></article>
        <article class="admin-list-item"><h3>Ticket médio</h3><p>${asCurrency(avgTicket)}</p></article>
      </div>
    `;
  };

  const tabButtons = Array.from(document.querySelectorAll('[data-admin-tab]'));
  const setTab = (tab) => {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.adminTab === tab;
      btn.classList.toggle('button-primary', isActive);
      btn.classList.toggle('button-secondary', !isActive);
      btn.classList.toggle('ring-2', isActive);
      btn.classList.toggle('ring-primary/40', isActive);
      btn.classList.toggle('shadow-md', isActive);
      btn.classList.toggle('scale-[1.01]', isActive);
      btn.classList.toggle('opacity-90', !isActive);
    });

    queuePage = 0;
    if (tab === 'today') {
      renderAppointments(todayQueueAppointments, 'Hoje');
      renderFinance(revenueToday, todayAppointments.length, 'Hoje');
    } else {
      renderAppointments(weekQueueAppointments, 'Esta semana');
      renderFinance(revenueWeek, weekAppointments.length, 'Semana');
    }
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.adminTab || 'today'));
  });

  setTab('today');
}


function initClientHomePage() {
  const wrap = document.getElementById('client-branding');
  if (!wrap) return;
  const brand = getBrandSettings();
  const nameEl = document.getElementById('client-brand-name');
  const logoEl = document.getElementById('client-brand-logo');
  if (nameEl) nameEl.textContent = brand.shopName;
  if (logoEl) {
    if (brand.logoUrl) {
      logoEl.src = brand.logoUrl;
      logoEl.style.display = 'block';
    } else logoEl.style.display = 'none';
  }

  const session = getSession();
  if (!session || !hasRole('client')) {
    window.location.href = 'login.html?redirect=client-home.html';
    return;
  }

  const appointments = getAppointments().filter((a) => a.client_email === session.email);
  const next = appointments
    .filter((a) => ['awaiting_payment', 'pending', 'confirmed'].includes(a.status) && new Date(a.start_datetime).getTime() >= Date.now())
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))[0];


  const metrics = document.getElementById('client-quick-metrics');
  if (metrics) metrics.innerHTML = '';

  const nextWrap = document.getElementById('client-next-appointment');
  if (nextWrap) {
    if (!next) {
      nextWrap.innerHTML = `<article class="schedule-item"><h3>Próximo agendamento</h3><p>Nenhum horário futuro encontrado.</p></article>`;
    } else {
      const statusLabel = getBookingStatusLabel(next.status);
      const statusTone =
        next.status === 'confirmed'
          ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40'
          : next.status === 'awaiting_payment'
            ? 'bg-amber-500/15 text-amber-200 border-amber-400/40'
            : 'bg-sky-500/15 text-sky-200 border-sky-400/40';

      nextWrap.innerHTML = `
        <article class="group relative overflow-hidden rounded-2xl border border-borderc bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/70 p-4 md:p-5 shadow-soft transition-all duration-300 hover:border-primary/45 hover:shadow-[0_14px_45px_rgba(198,154,69,0.15)] hover:-translate-y-[1px]">
          <div class="pointer-events-none absolute -top-16 -right-14 h-44 w-44 rounded-full bg-primary/10 blur-2xl transition-transform duration-500 group-hover:scale-110"></div>
          <div class="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl transition-transform duration-500 group-hover:scale-110"></div>
          <div class="relative grid gap-4">
            <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary/90">Próximo agendamento</p>
                <h3 class="text-xl font-semibold text-text-primary md:text-2xl">${next.service_name}</h3>
              </div>
              <span class="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}">
                <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                ${statusLabel}
              </span>
            </header>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
                <p class="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary"><span aria-hidden="true">📅</span> Data e hora</p>
                <p class="text-sm font-semibold text-text-primary">${formatBookingDateTime(next.appointment_date, next.start_time)}</p>
              </div>
              <div class="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
                <p class="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary"><span aria-hidden="true">💈</span> Profissional</p>
                <p class="text-sm font-semibold text-text-primary">${next.barber_name}</p>
              </div>
              <div class="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
                <p class="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary"><span aria-hidden="true">📍</span> Unidade</p>
                <p class="text-sm font-semibold text-text-primary">${next.branch}</p>
              </div>
              <div class="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
                <p class="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary"><span aria-hidden="true">🌆</span> Cidade</p>
                <p class="text-sm font-semibold text-text-primary">${next.city || 'Porto Alegre'}</p>
              </div>
            </div>

            <div class="grid gap-2 md:grid-cols-2">
              <button class="button button-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 min-h-11 font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary bg-primary text-zinc-900 hover:bg-primary-dark hover:shadow-md hover:scale-[1.01] active:scale-[0.99]" data-client-reschedule="${next.id}">
                <span aria-hidden="true">↻</span> Reagendar
              </button>
              <button class="button button-secondary inline-flex items-center justify-center gap-2 rounded-xl px-4 min-h-11 font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary border border-borderc bg-surface text-text-primary hover:border-primary/70 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]" data-client-cancel="${next.id}">
                <span aria-hidden="true">✕</span> Cancelar
              </button>
            </div>
          </div>
        </article>
      `;
      nextWrap.querySelector('[data-client-reschedule]')?.addEventListener('click', () => {
        const city = BASE_DATA.cities.find((c) => c.name === next.city);
        const branch = city?.branches.find((x) => x.name === next.branch);
        saveBooking({ city: city?.id || 'poa', branch: branch?.id || 'bom-fim', service: next.service_id, professional: next.barber_id, date: next.appointment_date, time: next.start_time, edit_appointment_id: next.id });
        window.location.href = 'booking-datetime.html?edit=datetime';
      });
      nextWrap.querySelector('[data-client-cancel]')?.addEventListener('click', async () => {
        if (!(await confirmAction('Deseja realmente cancelar este agendamento?'))) return;
        updateAppointmentStatus(next.id, 'canceled');
        initClientHomePage();
      });
    }
  }

  const stats = document.getElementById('client-stats');
  if (stats) stats.innerHTML = '';

  const notif = document.getElementById('client-notifications');
  if (notif) notif.innerHTML = '';
}

function initAdminSettingsPage() {
  const form = document.getElementById('admin-settings-form');
  if (!form) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const nameEl = document.getElementById('shop-name');
  const logoUrlEl = document.getElementById('shop-logo-url');
  const logoFileEl = document.getElementById('shop-logo-file');
  const uploadBtn = document.getElementById('shop-logo-trigger');
  const fileLabelEl = document.getElementById('shop-logo-file-label');
  const previewName = document.getElementById('brand-preview-name');
  const previewLogo = document.getElementById('brand-preview-logo');
  const previewPlaceholder = document.getElementById('brand-preview-placeholder');

  const brand = getBrandSettings();
  nameEl.value = brand.shopName;
  if (logoUrlEl) logoUrlEl.value = brand.logoUrl;

  const updatePreview = (logo) => {
    previewName.textContent = nameEl.value || 'BarberPro';
    if (previewLogo && logo) {
      previewLogo.src = logo;
      previewLogo.style.display = 'block';
      if (previewPlaceholder) previewPlaceholder.style.display = 'none';
    } else {
      if (previewLogo) previewLogo.style.display = 'none';
      if (previewPlaceholder) previewPlaceholder.style.display = 'inline-flex';
    }
  };

  updatePreview(brand.logoUrl);
  nameEl.addEventListener('input', () => updatePreview(logoUrlEl?.value || ''));
  if (uploadBtn && logoFileEl) {
    uploadBtn.addEventListener('click', () => logoFileEl.click());
  }

  logoFileEl?.addEventListener('change', () => {
    const file = logoFileEl.files?.[0];
    if (!file) return;
    if (fileLabelEl) fileLabelEl.textContent = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      if (logoUrlEl) logoUrlEl.value = String(reader.result || '');
      updatePreview(logoUrlEl?.value || '');
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveBrandSettings({ shopName: nameEl.value.trim() || 'BarberPro', logoUrl: (logoUrlEl?.value || '').trim() });
    applyBrandTheme();
    logAudit('brand_updated', { shopName: nameEl.value.trim() });
    await alertAction('Configuracoes atualizadas com sucesso.', { title: 'Tudo certo', confirmText: 'Fechar' });
  });
}

function initUnitSettingsPage() {
  const form = document.getElementById('unit-settings-form');
  if (!form) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const fields = {
    opening_time: document.getElementById('us-opening-time'),
    closing_time: document.getElementById('us-closing-time'),
    slot_interval_minutes: document.getElementById('us-slot-interval'),
    cancellation_limit_hours: document.getElementById('us-cancel-limit'),
    prepayment_enabled: document.getElementById('us-prepayment-enabled')
  };

  const current = getUnitSettings();
  Object.entries(fields).forEach(([k, el]) => {
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!current[k];
    else el.value = current[k];
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveUnitSettings({
      opening_time: fields.opening_time.value,
      closing_time: fields.closing_time.value,
      slot_interval_minutes: Number(fields.slot_interval_minutes.value),
      cancellation_limit_hours: Number(fields.cancellation_limit_hours.value),
      prepayment_enabled: fields.prepayment_enabled.checked
    });
  });
}

function initStockPage() {
  const form = document.getElementById('product-form');
  const listEl = document.getElementById('products-list');
  if (!form || !listEl) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const idEl = document.getElementById('product-id');
  const nameEl = document.getElementById('product-name');
  const qtyEl = document.getElementById('product-quantity');
  const minEl = document.getElementById('product-minimum');

  function reset() {
    idEl.value = '';
    nameEl.value = '';
    qtyEl.value = '0';
    minEl.value = '0';
  }

  function render() {
    const rows = getProducts();
    listEl.innerHTML = rows
      .map((p) => `<article class="schedule-item"><h3>${p.name}</h3><p>Quantidade: ${p.quantity} · Mínimo: ${p.minimum_stock}</p><div class="form-row"><button type="button" class="button button-secondary" data-edit="${p.id}">Editar</button><button type="button" class="button button-secondary" data-delete="${p.id}">Excluir</button></div></article>`)
      .join('');

    listEl.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = rows.find((x) => x.id === btn.dataset.edit);
        if (!p) return;
        idEl.value = p.id;
        nameEl.value = p.name;
        qtyEl.value = String(p.quantity);
        minEl.value = String(p.minimum_stock);
      });
    });

    listEl.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = rows.map((x) => (x.id === btn.dataset.delete ? { ...x, deleted_at: nowIso(), updated_at: nowIso() } : x));
        saveProducts(next);
        logAudit('product_soft_deleted', { product_id: btn.dataset.delete });
        render();
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rows = getProducts();
    const payload = {
      id: idEl.value || slugify(nameEl.value),
      unit_id: APP_CONFIG.unitId,
      name: nameEl.value.trim(),
      quantity: Number(qtyEl.value || 0),
      minimum_stock: Number(minEl.value || 0),
      created_at: nowIso(),
      updated_at: nowIso()
    };

    const idx = rows.findIndex((x) => x.id === payload.id);
    if (idx >= 0) rows[idx] = { ...rows[idx], ...payload, updated_at: nowIso() };
    else rows.push(payload);

    saveProducts(rows);
    logAudit('product_saved', { product_id: payload.id });
    reset();
    render();
  });

  render();
}

function initClientSubscriptionsPage() {
  const root = document.getElementById('client-subscriptions-root');
  if (!root) return;

  const session = getSession();
  if (!session || !hasRole('client')) {
    root.innerHTML = '<div class="empty-state"><h2>Faça login como cliente</h2><p>Você precisa entrar para assinar um plano.</p><a class="button button-primary" href="login.html?redirect=client-subscriptions.html">Efetuar login</a></div>';
    return;
  }

  ensureDefaultSubscriptionPlans();
  const planOrder = ['plano-bronze', 'plano-prata', 'plano-ouro'];
  const plans = getSubscriptionPlans()
    .filter((p) => planOrder.includes(p.id) && p.is_active !== false)
    .sort((a, b) => planOrder.indexOf(a.id) - planOrder.indexOf(b.id));
  const subscriptions = getSubscriptions();
  const currentSub = subscriptions.filter((s) => s.user_id === session.email).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0] || null;
  const active = currentSub && currentSub.status === 'active' ? currentSub : null;
  const expiredBanner = currentSub && currentSub.status !== 'active' ? `<article class="schedule-item"><h3>⚠ Plano vencido</h3><p>Seu status atual é <strong>${currentSub.status}</strong>. O consumo de sessões está bloqueado até regularização.</p></article>` : '';
  root.innerHTML = `
    ${expiredBanner}<section class="subscription-info-stack">
      ${active ? `<article class=\"schedule-item subscription-static-card\"><h3>Assinatura ativa</h3><p>Plano: <strong>${active.plan_name || active.plan_id}</strong></p><p>Sessões restantes: ${active.remaining_sessions >= 9999 ? 'Ilimitadas' : active.remaining_sessions}</p><small>Válido até ${new Date(active.expires_at).toLocaleDateString('pt-BR')}</small></article>` : `<article class=\"schedule-item subscription-static-card\"><h3>Sem assinatura ativa</h3><p>Escolha um plano abaixo para começar.</p></article>`}
      <article class=\"schedule-item subscription-static-card\"><h3>Informações da assinatura</h3><p>Os planos são renovados mensalmente.</p><small>Você pode cancelar e contratar novamente quando quiser.</small></article>
    </section>
    <section class="subscription-plans-stack">
      <article class=\"schedule-item subscription-static-card\"><h3>Planos disponíveis</h3><p>Escolha seu plano e confirme a assinatura.</p></article>
      ${plans.map((p) => `<article class=\"schedule-item subscription-plan-card subscription-clickable-card\"><h3>${p.name}</h3><p>${asCurrency(p.price)} / mês</p><p>${p.sessions_per_month >= 9999 ? 'Cortes ilimitados' : `${p.sessions_per_month} cortes por mês`}</p><small>${(p.benefits || []).join(' • ')}</small><div class=\"form-row\"><button class=\"button button-primary\" data-subscribe=\"${p.id}\">Escolher ${p.name.replace(/^[🥉🥈🥇]\s*/, '')}</button></div></article>`).join('')}
    </section>
  `;

  root.querySelectorAll('[data-subscribe]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const plan = plans.find((x) => x.id === btn.dataset.subscribe);
      if (!plan) return;
      if (!(await confirmAction(`Confirmar assinatura do ${plan.name} por ${asCurrency(plan.price)} / mês?`))) return;
      const rows = getSubscriptions().filter((s) => s.user_id !== session.email);
      rows.unshift({
        id: `sub_${Date.now()}`,
        unit_id: APP_CONFIG.unitId,
        user_id: session.email,
        plan_id: plan.id,
        plan_name: plan.name,
        remaining_sessions: Number(plan.sessions_per_month || 0),
        expires_at: addMinutes(new Date(), Number(plan.duration_days || 30) * 24 * 60).toISOString(),
        status: 'active',
        created_at: nowIso(),
        updated_at: nowIso()
      });
      saveSubscriptions(rows);
      logAudit('client_subscription_created', { user_id: session.email, plan_id: plan.id });
      initClientSubscriptionsPage();
    });
  });
}


function initClientHistoryPage() {
  const root = document.getElementById('client-history-root');
  if (!root) return;
  const session = getSession();
  if (!session || !hasRole('client')) {
    window.location.href = 'login.html?redirect=client-history.html';
    return;
  }
  const appointments = getAppointments().filter((a) => a.client_email === session.email).sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime));
  const payments = getJson(STORAGE_KEYS.payments, []);
  const reviews = getJson(STORAGE_KEYS.reviews, []);
  const usage = getSubscriptionUsage();
  root.innerHTML = appointments.map((a) => {
    const pay = payments.find((p) => p.appointment_id === a.id);
    const rev = reviews.find((r) => r.appointment_id === a.id);
    const usedSub = usage.some((u) => u.appointment_id === a.id);
    const reviewAction = a.status === 'completed' && !rev ? `<button class="button button-secondary" data-review="${a.id}">Avaliar</button>` : (rev ? `<small>Avaliação: ${rev.rating}/5</small>` : '');
    return `<article class="schedule-item"><h3>${a.service_name} · ${formatBookingDateTime(a.appointment_date, a.start_time)}</h3><p>${a.barber_name} · ${a.branch}</p><small>Status: ${a.status} · Pago: ${asCurrency(pay?.amount || a.service_price)} · Assinatura: ${usedSub ? 'Sim' : 'Não'}</small><div class="form-row">${reviewAction}</div></article>`;
  }).join('') || '<article class="schedule-item"><h3>Histórico vazio</h3></article>';
  root.querySelectorAll('[data-review]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rating = Number(prompt('Avalie de 1 a 5', '5') || 0);
      if (rating < 1 || rating > 5) return;
      const comment = prompt('Comentário (opcional)', '') || '';
      const rows = getJson(STORAGE_KEYS.reviews, []);
      if (rows.some((r) => r.appointment_id === btn.dataset.review)) return;
      rows.unshift({ id: `rev_${Date.now()}`, appointment_id: btn.dataset.review, rating, comment, created_at: nowIso() });
      setJson(STORAGE_KEYS.reviews, rows);
      initClientHistoryPage();
    });
  });
}



function initClientProfilePage() {
  const form = document.getElementById('client-profile-form');
  if (!form) return;
  const session = getSession();
  if (!session || !hasRole('client')) {
    window.location.href = 'login.html?redirect=client-profile';
    return;
  }
  const profile = getClientProfile(session.email);
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const phoneEl = document.getElementById('profile-phone');
  const profileNameEl = document.getElementById('client-profile-name');
  const profileEmailEl = document.getElementById('client-profile-email');
  const profileAvatarEl = document.getElementById('client-profile-avatar');
  nameEl.value = profile.name || '';
  emailEl.value = profile.email || session.email;
  phoneEl.value = profile.phone || '';

  const syncProfilePreview = () => {
    if (profileNameEl) profileNameEl.textContent = nameEl.value || 'Cliente';
    if (profileEmailEl) profileEmailEl.textContent = emailEl.value || session.email;
    if (profileAvatarEl) {
      const initials = String(nameEl.value || 'Cliente')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
      profileAvatarEl.textContent = initials || 'CL';
    }
  };

  syncProfilePreview();
  nameEl.addEventListener('input', syncProfilePreview);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const patch = {
      name: sanitizeText(nameEl.value),
      phone: sanitizeText(phoneEl.value),
      updated_by: session.email
    };
    saveClientProfile(session.email, patch);
    logAudit('client_profile_updated', { user_id: session.email, changes: patch });
    let feedback = form.querySelector('[data-profile-feedback]');
    if (!feedback) {
      feedback = document.createElement('small');
      feedback.setAttribute('data-profile-feedback', '1');
      feedback.style.color = 'var(--text-secondary)';
      form.appendChild(feedback);
    }
    syncProfilePreview();
    feedback.textContent = 'Perfil salvo com sucesso.';
  });
}

function createClientNotificationsBell(session) {
  return null;
}

function initClientNotificationsPage() {
  const root = document.getElementById('client-notifications-root');
  if (!root) return;
  const session = getSession();
  if (!session || !hasRole('client')) {
    window.location.href = 'login.html?redirect=client-notifications.html';
    return;
  }
  const rows = getNotifications().filter((n) => n.user_id === session.email).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  root.innerHTML = rows.map((n) => `<article class="schedule-item"><h3>${n.type}</h3><p>${n.status}</p><small>${new Date(n.created_at || nowIso()).toLocaleString('pt-BR')}</small></article>`).join('') || '<article class="schedule-item"><h3>Sem notificações</h3></article>';
}

function initSubscriptionsPage() {
  const root = document.getElementById('subscriptions-root');
  if (!root) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  ensureDefaultSubscriptionPlans();
  const planOrder = ['plano-bronze', 'plano-prata', 'plano-ouro'];
  const plans = getSubscriptionPlans()
    .filter((p) => planOrder.includes(p.id) && p.is_active !== false)
    .sort((a, b) => planOrder.indexOf(a.id) - planOrder.indexOf(b.id));
  const subs = getSubscriptions();
  const activeSubs = subs.filter((s) => s.status === 'active');

  const byPlan = {};
  activeSubs.forEach((s) => {
    byPlan[s.plan_id] = (byPlan[s.plan_id] || 0) + 1;
  });

  root.innerHTML = `
    <article class="schedule-item"><h3>Resumo de assinaturas</h3><p>Total ativas: <strong>${activeSubs.length}</strong></p><small>Exibindo apenas planos ativos implementáveis.</small></article>
    ${plans.map((p) => `<article class="schedule-item"><h3>${p.name}</h3><p>${asCurrency(p.price)} / mês • ${p.sessions_per_month} cortes</p><small>${(p.benefits || []).join(' • ') || '-'}</small><p>Clientes assinantes: <strong>${byPlan[p.id] || 0}</strong></p></article>`).join('')}
    <article class="schedule-item"><h3>Assinaturas ativas (detalhado)</h3><p>${activeSubs.length ? activeSubs.map((s) => `${s.user_id} — Plano: ${s.plan_name || s.plan_id} (${s.remaining_sessions} cortes restantes)`).join(' · ') : 'Nenhuma assinatura ativa'}</p></article>
  `;
}

﻿function initSuperAdminTenantsPage() {
  const root = document.getElementById('tenants-root');
  if (!root) return;
  if (!requireRole(['super_admin'], 'super-admin-login.html')) return;

  const totalEl = document.getElementById('sa-total-barbershops');
  const totalAllEl = document.getElementById('sa-total-all');
  const totalActiveEl = document.getElementById('sa-total-active');
  const totalTrialEl = document.getElementById('sa-total-trial');
  const totalSuspendedEl = document.getElementById('sa-total-suspended');

  const asDateTime = (iso) => {
    const d = new Date(iso || 0);
    if (!Number.isFinite(d.getTime())) return '-';
    return d.toLocaleString('pt-BR');
  };

  const asDate = (iso) => {
    const d = new Date(iso || 0);
    if (!Number.isFinite(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
  };

  const allowedStatus = new Set(['active', 'trial', 'suspended', 'disabled']);
  const allowedPlan = new Set(['free', 'basic', 'pro', 'enterprise']);
  const normalizeStatus = (value) => (allowedStatus.has(value) ? value : 'active');
  const normalizePlan = (value) => (allowedPlan.has(value) ? value : 'basic');
  const getStatusMeta = (status) => {
    if (status === 'trial') return { label: 'Trial', css: 'status-trial' };
    if (status === 'suspended') return { label: 'Suspensa', css: 'status-suspended' };
    if (status === 'disabled') return { label: 'Desativada', css: 'status-canceled' };
    return { label: 'Ativa', css: 'status-confirmed' };
  };

  const upsertAdminUserForShop = (shop, passwordOverride = '') => {
    const users = getPlatformUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === shop.email.toLowerCase());
    const password = passwordOverride || String(shop.password_hash || '').replace(/^plain:/, '') || '123456';
    const payload = {
      email: shop.email,
      password,
      role: 'admin',
      name: shop.owner_name || 'Administrador',
      unit_id: shop.id,
      barbershop_id: shop.id
    };
    if (idx >= 0) users[idx] = { ...users[idx], ...payload };
    else users.push(payload);
    savePlatformUsers(users);
  };

  const removeAdminUserForShop = (shop) => {
    savePlatformUsers(getPlatformUsers().filter((u) => !(u.role === 'admin' && u.email.toLowerCase() === shop.email.toLowerCase())));
  };

  const syncTenantFromShop = (shop) => {
    const tenants = getJson(STORAGE_KEYS.tenants, []);
    const idx = tenants.findIndex((t) => t.id === shop.tenant_id || t.id === shop.id);
    const payload = {
      id: shop.tenant_id || shop.id,
      name: shop.name,
      subscription_plan_id: normalizePlan(shop.plan || (tenants[idx] && tenants[idx].subscription_plan_id) || 'basic'),
      subscription_status: shop.status === 'disabled' ? 'disabled' : shop.status === 'suspended' ? 'suspended' : 'active',
      created_at: (tenants[idx] && tenants[idx].created_at) || shop.created_at || nowIso(),
      updated_at: nowIso()
    };
    if (idx >= 0) tenants[idx] = { ...tenants[idx], ...payload };
    else tenants.unshift(payload);
    setJson(STORAGE_KEYS.tenants, tenants);
  };

  const removeTenantFromShop = (shop) => {
    setJson(STORAGE_KEYS.tenants, getJson(STORAGE_KEYS.tenants, []).filter((t) => t.id !== shop.tenant_id && t.id !== shop.id));
  };

  const render = () => {
    const rows = getBarbershops()
      .map((row) => ({
        ...row,
        status: normalizeStatus(row.status),
        plan: normalizePlan(row.plan),
        plan_expires_at: row.plan_expires_at || null
      }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    if (totalEl) totalEl.textContent = String(rows.length);
    if (totalAllEl) totalAllEl.textContent = String(rows.length);
    if (totalActiveEl) totalActiveEl.textContent = String(rows.filter((x) => x.status === 'active').length);
    if (totalTrialEl) totalTrialEl.textContent = String(rows.filter((x) => x.status === 'trial').length);
    if (totalSuspendedEl) totalSuspendedEl.textContent = String(rows.filter((x) => x.status === 'suspended').length);

    root.innerHTML = rows.length
      ? rows
        .map((shop) => `
          <article class="superadmin-table-row">
            <div><strong>${sanitizeText(shop.name)}</strong><small>ID: ${sanitizeText(shop.id)}</small></div>
            <div>${sanitizeText(shop.owner_name || '-')}</div>
            <div>${sanitizeText(shop.email || '-')}</div>
            <div>${sanitizeText(shop.phone || '-')}</div>
            <div><span class="status-badge ${getStatusMeta(shop.status).css}">${getStatusMeta(shop.status).label}</span></div>
            <div><strong>${String(shop.plan || 'basic').toUpperCase()}</strong><small>${shop.plan_expires_at ? `Expira em ${asDate(shop.plan_expires_at)}` : 'Sem expiracao'}</small></div>
            <div>${asDateTime(shop.created_at)}</div>
            <div class="superadmin-actions">
              <button type="button" class="button button-secondary superadmin-action-btn" data-sa-action="edit" data-id="${shop.id}">Editar</button>
              <button type="button" class="button button-secondary superadmin-action-btn" data-sa-action="toggle" data-id="${shop.id}">${shop.status === 'disabled' ? 'Ativar' : 'Desativar'}</button>
              <button type="button" class="button button-secondary superadmin-action-btn" data-sa-action="reset" data-id="${shop.id}">Reset senha</button>
              <button type="button" class="button button-danger superadmin-action-btn superadmin-action-delete" data-sa-action="delete" data-id="${shop.id}">Excluir</button>
            </div>
          </article>
        `)
        .join('')
      : '<article class="schedule-item"><h3>Nenhuma barbearia cadastrada</h3><p>Use o formulario para criar a primeira.</p></article>';
  };

  root.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-sa-action]');
    if (!target) return;
    const action = target.dataset.saAction;
    const id = target.dataset.id;
    const rows = getBarbershops();
    const idx = rows.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const row = rows[idx];

    if (action === 'edit') {
      window.location.href = `super-admin-barbershop-form.html?id=${encodeURIComponent(row.id)}`;
      return;
    }

    if (action === 'toggle') {
      const toDisable = row.status !== 'disabled';
      const ok = await confirmAction(toDisable ? 'Deseja desativar esta barbearia?' : 'Deseja reativar esta barbearia?', {
        title: toDisable ? 'Desativar barbearia' : 'Ativar barbearia',
        confirmText: toDisable ? 'Desativar' : 'Ativar'
      });
      if (!ok) return;

      rows[idx] = { ...row, status: toDisable ? 'disabled' : 'active', updated_at: nowIso() };
      saveBarbershops(rows);
      syncTenantFromShop(rows[idx]);
      logAudit('superadmin_barbershop_status_changed', { barbershop_id: row.id, status: rows[idx].status });
      render();
      return;
    }

    if (action === 'reset') {
      const ok = await confirmAction('Definir senha padrão para esta barbearia?', {
        title: 'Reset de senha',
        confirmText: 'Resetar'
      });
      if (!ok) return;
      const nextPassword = '123456';
      rows[idx] = { ...row, password_hash: `plain:${nextPassword}`, updated_at: nowIso() };
      saveBarbershops(rows);
      syncTenantFromShop(rows[idx]);
      upsertAdminUserForShop(rows[idx], nextPassword);
      await alertAction('Senha redefinida para: 123456', { title: 'Senha atualizada' });
      logAudit('superadmin_barbershop_password_reset', { barbershop_id: row.id });
      render();
      return;
    }

    if (action === 'delete') {
      const ok = await confirmAction('Excluir permanentemente esta barbearia?', {
        title: 'Excluir barbearia',
        confirmText: 'Excluir'
      });
      if (!ok) return;

      const [removed] = rows.splice(idx, 1);
      saveBarbershops(rows);
      removeTenantFromShop(removed);
      removeAdminUserForShop(removed);
      logAudit('superadmin_barbershop_deleted', { barbershop_id: removed.id });
      render();
    }
  });
  render();
}

﻿function initSuperAdminBarbershopFormPage() {
  const form = document.getElementById('superadmin-barbershop-form');
  if (!form) return;
  if (!requireRole(['super_admin'], 'super-admin-login.html')) return;

  const feedbackEl = document.getElementById('superadmin-feedback');
  const editIdEl = document.getElementById('sa-edit-id');
  const nameEl = document.getElementById('sa-name');
  const ownerEl = document.getElementById('sa-owner-name');
  const emailEl = document.getElementById('sa-email');
  const phoneEl = document.getElementById('sa-phone');
  const passwordEl = document.getElementById('sa-password');
  const addressEl = document.getElementById('sa-address');
  const planEl = document.getElementById('sa-plan');
  const planExpiresEl = document.getElementById('sa-plan-expires-at');
  const statusEl = document.getElementById('sa-status');
  const submitBtn = document.getElementById('sa-submit');
  const cancelBtn = document.getElementById('sa-cancel');

  if (!nameEl || !ownerEl || !emailEl || !phoneEl || !passwordEl || !statusEl || !planEl || !planExpiresEl || !submitBtn || !cancelBtn || !editIdEl) return;

  const allowedStatus = new Set(['active', 'trial', 'suspended', 'disabled']);
  const allowedPlan = new Set(['free', 'basic', 'pro', 'enterprise']);
  const normalizeStatus = (value) => (allowedStatus.has(value) ? value : 'active');
  const normalizePlan = (value) => (allowedPlan.has(value) ? value : 'basic');
  const toDateInput = (iso) => {
    const d = new Date(iso || 0);
    if (!Number.isFinite(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const upsertAdminUserForShop = (shop, passwordOverride = '') => {
    const users = getPlatformUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === shop.email.toLowerCase());
    const password = passwordOverride || String(shop.password_hash || '').replace(/^plain:/, '') || '123456';
    const payload = {
      email: shop.email,
      password,
      role: 'admin',
      name: shop.owner_name || 'Administrador',
      unit_id: shop.id,
      barbershop_id: shop.id
    };
    if (idx >= 0) users[idx] = { ...users[idx], ...payload };
    else users.push(payload);
    savePlatformUsers(users);
  };

  const syncTenantFromShop = (shop) => {
    const tenants = getJson(STORAGE_KEYS.tenants, []);
    const idx = tenants.findIndex((t) => t.id === shop.tenant_id || t.id === shop.id);
    const payload = {
      id: shop.tenant_id || shop.id,
      name: shop.name,
      subscription_plan_id: normalizePlan(shop.plan || (tenants[idx] && tenants[idx].subscription_plan_id) || 'basic'),
      subscription_status: shop.status === 'disabled' ? 'disabled' : shop.status === 'suspended' ? 'suspended' : 'active',
      created_at: (tenants[idx] && tenants[idx].created_at) || shop.created_at || nowIso(),
      updated_at: nowIso()
    };
    if (idx >= 0) tenants[idx] = { ...tenants[idx], ...payload };
    else tenants.unshift(payload);
    setJson(STORAGE_KEYS.tenants, tenants);
  };

  const resetForm = () => {
    editIdEl.value = '';
    form.reset();
    statusEl.value = 'active';
    planEl.value = 'basic';
    planExpiresEl.value = '';
    submitBtn.textContent = 'Cadastrar barbearia';
  };

  resetForm();

  const params = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/superadmin\/barbershops\/([^/]+)\/edit\/?$/i);
  const editId = params.get('id') || (pathMatch ? decodeURIComponent(pathMatch[1]) : '');
  if (editId) {
    const current = getBarbershops().find((x) => x.id === editId);
    if (current) {
      editIdEl.value = current.id;
      nameEl.value = current.name || '';
      ownerEl.value = current.owner_name || '';
      emailEl.value = current.email || '';
      phoneEl.value = current.phone || '';
      passwordEl.value = '';
      if (addressEl) addressEl.value = current.address || '';
      planEl.value = normalizePlan(current.plan || 'basic');
      planExpiresEl.value = toDateInput(current.plan_expires_at);
      statusEl.value = normalizeStatus(current.status || 'active');
      submitBtn.textContent = 'Salvar alteracoes';
    }
  }

  cancelBtn.addEventListener('click', () => {
    window.location.href = 'super-admin-tenants.html';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rows = getBarbershops();
    const isEdit = !!editIdEl.value;
    const existingIdx = rows.findIndex((x) => x.id === editIdEl.value);
    const incomingEmail = sanitizeText(emailEl.value).toLowerCase();

    const duplicated = rows.some((x) => x.email.toLowerCase() === incomingEmail && x.id !== editIdEl.value);
    if (duplicated) {
      if (feedbackEl) feedbackEl.textContent = 'Ja existe uma barbearia com este email.';
      return;
    }

    const createdId = isEdit
      ? editIdEl.value
      : `shop_${slugify(nameEl.value || ownerEl.value || `novo-${Date.now()}`)}_${Date.now().toString().slice(-6)}`;

    const passwordRaw = sanitizeText(passwordEl.value) || (isEdit ? String(rows[existingIdx]?.password_hash || '').replace(/^plain:/, '') : '123456');

    const payload = {
      id: createdId,
      barbershop_id: createdId,
      tenant_id: createdId,
      name: sanitizeText(nameEl.value),
      owner_name: sanitizeText(ownerEl.value),
      email: incomingEmail,
      phone: sanitizeText(phoneEl.value),
      password_hash: `plain:${passwordRaw}`,
      address: sanitizeText(addressEl?.value || ''),
      status: normalizeStatus(statusEl.value),
      plan: normalizePlan(planEl.value),
      plan_expires_at: planExpiresEl.value ? `${planExpiresEl.value}T23:59:59.000Z` : null,
      created_at: isEdit && existingIdx >= 0 ? rows[existingIdx].created_at : nowIso(),
      updated_at: nowIso()
    };

    if (isEdit && existingIdx >= 0) rows[existingIdx] = payload;
    else rows.unshift(payload);

    saveBarbershops(rows);
    syncTenantFromShop(payload);
    upsertAdminUserForShop(payload, passwordRaw);
    logAudit(isEdit ? 'superadmin_barbershop_updated' : 'superadmin_barbershop_created', { barbershop_id: payload.id, status: payload.status });

    await alertAction(isEdit ? 'Barbearia atualizada com sucesso.' : 'Barbearia cadastrada com sucesso.', { title: 'Operacao concluida' });
    window.location.href = 'super-admin-tenants.html';
  });
}

function initAdminFinanceModuleCards() {
  return;
}

function initBarberHomePage() {
  if (!document.title.includes('Painel Barbeiro')) return;
  if (!requireRole(['barber'], 'login.html')) return;

  const agendaRoot = document.getElementById('barber-home-agenda');
  const todayEl = document.getElementById('barber-earnings-today');
  const weekEl = document.getElementById('barber-earnings-week');
  const agendaCountEl = document.getElementById('barber-agenda-count');
  if (!agendaRoot) return;

  const session = getSession();
  const now = new Date();

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const weekStart = new Date(dayStart);
  weekStart.setDate(dayStart.getDate() - ((dayStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const toDate = (value) => {
    const parsed = new Date(value || '');
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const statusBadgeClass = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'completed') return 'status-completed';
    if (normalized === 'confirmed') return 'status-confirmed';
    if (normalized === 'pending') return 'status-pending';
    if (normalized === 'awaiting_payment') return 'status-awaiting_payment';
    if (normalized === 'no_show') return 'status-no_show';
    if (normalized === 'canceled') return 'status-canceled';
    return '';
  };

  const statusIcon = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'completed') return '●';
    if (normalized === 'confirmed' || normalized === 'pending' || normalized === 'awaiting_payment') return '◷';
    if (normalized === 'no_show' || normalized === 'canceled') return '▲';
    return '○';
  };

  const activeBarber = getBarbers().find((b) => {
    const sameId = String(b.id || '') === String(session?.barberId || session?.id || '');
    const sameEmail = String(b.email || '').toLowerCase() === String(session?.email || '').toLowerCase();
    return sameId || sameEmail;
  });

  const render = () => {
    const rows = getAppointments()
      .filter((a) => {
        const sameBarberId = String(a.barber_id || '') === String(activeBarber?.id || session?.barberId || '');
        const sameBarberName = String(a.barber_name || '').toLowerCase() === String(activeBarber?.name || '').toLowerCase();
        return sameBarberId || sameBarberName;
      })
      .sort((a, b) => new Date(a.start_datetime || 0) - new Date(b.start_datetime || 0));

    if (agendaCountEl) {
      agendaCountEl.textContent = `${rows.length} agendamento${rows.length === 1 ? '' : 's'}`;
    }

    const completedRows = rows.filter((a) => String(a.status || '').toLowerCase() === 'completed');
    const earningsToday = completedRows
      .filter((a) => {
        const date = toDate(a.start_datetime);
        return date && date >= dayStart && date < dayEnd;
      })
      .reduce((sum, a) => sum + Number(a.service_price || 0), 0);

    const earningsWeek = completedRows
      .filter((a) => {
        const date = toDate(a.start_datetime);
        return date && date >= weekStart && date < weekEnd;
      })
      .reduce((sum, a) => sum + Number(a.service_price || 0), 0);

    if (todayEl) todayEl.textContent = asCurrency(earningsToday);
    if (weekEl) weekEl.textContent = asCurrency(earningsWeek);

    if (!rows.length) {
      agendaRoot.innerHTML = `
        <article class="barber-appointment-card">
          <h3 class="barber-appointment-title">Sem agendamentos vinculados</h3>
          <p class="text-sm text-text-secondary mt-1">Quando novos atendimentos forem vinculados ao seu nome, eles aparecerao aqui.</p>
        </article>
      `;
      return;
    }

    agendaRoot.innerHTML = rows.map((a) => {
      const canConclude = ['pending', 'confirmed'].includes(String(a.status || '').toLowerCase());
      const createdAt = new Date(a.created_at || a.start_datetime || 0).toLocaleString('pt-BR');
      return `
        <article class="barber-appointment-card">
          <div class="barber-appointment-header">
            <div class="grid gap-2">
              <p class="barber-appointment-title">${a.service_name || 'Servico'}</p>
              <div class="barber-meta-grid">
                <p class="barber-meta-item">Cliente: <strong>${a.client_name || '-'}</strong></p>
                <p class="barber-meta-item">Atendimento: <strong>${formatBookingDateTime(a.appointment_date, a.start_time)}</strong></p>
                <p class="barber-meta-item">Criado em: <strong>${createdAt}</strong></p>
                <p class="barber-meta-item">Valor: <strong>${asCurrency(a.service_price || 0)}</strong></p>
              </div>
              <p class="barber-notes-item">Observacoes: <strong>${a.notes ? String(a.notes) : 'Sem observacoes registradas.'}</strong></p>
            </div>
            <div class="flex flex-col items-start gap-2 md:items-end">
              <span class="barber-badge ${statusBadgeClass(a.status)}"><span aria-hidden="true">${statusIcon(a.status)}</span>${getBookingStatusLabel(a.status).toUpperCase()}</span>
              <span class="barber-badge">ID: ${String(a.id || '').slice(0, 8)}</span>
            </div>
          </div>
          <div class="barber-appointment-actions">
            <p>Concluir habilitado para status pendente ou confirmado.</p>
            <button type="button" class="button button-primary min-h-10 w-full md:w-auto" data-barber-conclude="${a.id}" ${canConclude ? '' : 'disabled'}>${canConclude ? 'Concluir Servico' : 'Servico finalizado'}</button>
          </div>
        </article>
      `;
    }).join('');

    agendaRoot.querySelectorAll('[data-barber-conclude]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-barber-conclude');
        if (!id) return;
        updateAppointmentStatus(id, 'completed');
        await alertAction('Servico concluido com sucesso.', { title: 'Atendimento finalizado' });
        render();
      });
    });
  };

  render();
}

function dbEnabled() {
  return Boolean(DB_CONFIG.supabaseUrl && DB_CONFIG.supabaseAnonKey);
}

function ensureDbSchemaNote() {
  if (dbEnabled()) {
    // placeholder para integração backend real / transações
  }
}

﻿function initGlobalNavigation() {
  const session = getSession();
  const iconSvg = {
    home: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 10 9-7 9 7"></path><path d="M5 10v11h14V10"></path><path d="M9 21v-6h6v6"></path></svg></span>',
    back: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg></span>',
    menu: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16"></path><path d="M4 6h16"></path><path d="M4 18h16"></path></svg></span>',
    logout: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 21-5-5 5-5"></path><path d="M4 16h10"></path><path d="M20 3H12a2 2 0 0 0-2 2v4"></path><path d="M14 21h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-6"></path></svg></span>'
  };

  const handleLogout = () => {
    clearSession();
    resetBooking();
    window.location.href = 'login.html';
  };

  const getClientMenuDefaults = () => [
    ['client-subscriptions.html', 'Assinaturas'],
    ['client-history.html', 'Histórico'],
    ['client-profile', 'Perfil']
  ];



  if (session && ['admin', 'super_admin', 'barber'].includes(session.role)) {
    if (!document.querySelector('[data-logout]') && !document.querySelector('.admin-logout-btn')) {
      const wrap = document.createElement('div');
      wrap.className = 'admin-inline-actions';
      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'button button-secondary admin-logout-btn';
      logoutBtn.textContent = 'Sair';
      logoutBtn.addEventListener('click', handleLogout);
      wrap.appendChild(logoutBtn);

      const backLink = document.querySelector('.back-link');
      if (backLink && backLink.parentElement) backLink.parentElement.insertBefore(wrap, backLink.nextSibling);
      else {
        const card = document.querySelector('.booking-card, .hero-card, .form-card');
        if (card) card.insertBefore(wrap, card.firstChild);
      }
    }
  }

  document.querySelectorAll('.quick-nav').forEach((nav) => {
    nav.closest('.booking-card, .hero-card, .form-card, .auth-card')?.classList.add('quick-nav-host-open');
    nav.classList.remove('justify-end');
    nav.classList.add('justify-between', 'items-center');

    const home = nav.querySelector('[data-home]');
    const back = nav.querySelector('[data-back]');

    if (back) {
      back.innerHTML = `${iconSvg.back}<span class="sr-only">Voltar</span>`;
      back.setAttribute('aria-label', 'Voltar');
      back.classList.add('!w-10', '!min-h-10', '!px-0', 'rounded-full', 'nav-icon-btn');
      back.onclick = () => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = session?.role === 'client' ? 'client-home.html' : 'index.html';
      };
    }

    if (home) {
      home.innerHTML = `${iconSvg.home}<span class="sr-only">Home</span>`;
      home.setAttribute('aria-label', 'Home');
      home.classList.add('!w-10', '!min-h-10', '!px-0', 'rounded-full', 'nav-icon-btn');
      if (!session) home.setAttribute('href', 'index.html');
      else if (session.role === 'client') home.setAttribute('href', 'client-home.html');
      else if (session.role === 'barber') home.setAttribute('href', 'barber-home.html');
      else if (session.role === 'super_admin') home.setAttribute('href', 'super-admin-tenants.html');
      else home.setAttribute('href', 'admin-home.html');
    }

    const left = document.createElement('div');
    left.className = 'quick-nav-left flex items-center gap-2';
    if (back) left.appendChild(back);
    if (home) left.appendChild(home);
    if (left.children.length) nav.prepend(left);

    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'button button-secondary nav-icon-btn quick-menu-trigger inline-flex items-center justify-center rounded-xl px-3 min-h-10';
    menuBtn.setAttribute('aria-label', 'Abrir menu');
    menuBtn.innerHTML = `${iconSvg.menu}<span class="sr-only">Menu</span>`;

    const panel = document.createElement('div');
    panel.className = 'quick-menu-panel';

    const appendMenuLink = (href, label) => {
      const item = document.createElement('a');
      item.href = href;
      item.className = 'button button-secondary quick-menu-item';
      item.textContent = label;
      panel.appendChild(item);
    };

    const appendMenuButton = (label, onClick) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'button button-secondary quick-menu-item';
      item.textContent = label;
      item.addEventListener('click', onClick);
      panel.appendChild(item);
    };

    const extras = Array.from(nav.children).filter((el) => el !== left && el !== menuBtn && el !== panel);
    extras.forEach((el) => {
      if (el === home || el === back) return;
      if (el.matches('[data-logout]') || el.querySelector?.('[data-logout]')) {
        if (session) appendMenuButton('Sair', handleLogout);
      } else if (el.tagName === 'A') {
        appendMenuLink(el.getAttribute('href') || '#', el.textContent.trim() || 'Acessar');
      } else if (el.tagName === 'BUTTON') {
        appendMenuButton(el.textContent.trim() || 'Ação', () => el.click());
      }
      el.remove();
    });

    if (session?.role === 'client') {
      const existing = new Set(Array.from(panel.querySelectorAll('a')).map((a) => a.getAttribute('href')));
      getClientMenuDefaults().forEach(([href, label]) => {
        if (!existing.has(href)) appendMenuLink(href, label);
      });
      if (!panel.querySelector('button')) appendMenuButton('Sair', handleLogout);
    }

    if (session?.role === 'client' && !panel.children.length) {
      appendMenuButton('Sair', handleLogout);
    }

    const isAdminDashboard = /admin-home(\.html)?$/i.test(window.location.pathname) || document.getElementById('admin-metrics');
    if (isAdminDashboard) panel.innerHTML = '';

    const right = document.createElement('div');
    right.className = 'quick-nav-right relative';

    const notifications = createClientNotificationsBell(session);
    if (notifications) {
      right.appendChild(notifications.bellBtn);
    }

    const showMenu = !isAdminDashboard && !!panel.children.length;
    if (showMenu) {
      right.appendChild(menuBtn);
      right.appendChild(panel);
    }

    if (session && ['admin', 'super_admin', 'barber'].includes(session.role)) {
      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'button button-danger nav-icon-btn inline-flex items-center justify-center rounded-xl px-3 min-h-10';
      logoutBtn.innerHTML = `${iconSvg.logout}<span>Sair</span>`;
      logoutBtn.addEventListener('click', handleLogout);
      right.appendChild(logoutBtn);
    }

    if (!showMenu && !(session && ['admin', 'super_admin', 'barber'].includes(session.role))) return;
    nav.appendChild(right);

    if (showMenu) {
      menuBtn.addEventListener('click', () => {
        panel.classList.toggle('is-open');
      });
    }

    document.addEventListener('click', (e) => {
      if (showMenu && !right.contains(e.target)) {
        panel.classList.remove('is-open');
      }
    });
  });
}

﻿ensureSeed();
checkOverduePrepayments();
autoUpdateAppointmentStatuses();
applyBrandTheme();
ensureDbSchemaNote();

initLoginPage();
initSuperAdminLoginPage();
initLocationPage();
initServicePage();
initProfessionalPage();
initDatetimePage();
initBookingReviewPage();
initMySchedulesPage();
initAdminSchedulesPage();
initAdminBarbersPage();
initBlockedSlotsPage();
initAdminFinancePage();
initAdminDashboard();
initClientHomePage();
initClientSubscriptionsPage();
initClientHistoryPage();
initClientProfilePage();
initClientNotificationsPage();
initAdminSettingsPage();
initUnitSettingsPage();
initStockPage();
initSubscriptionsPage();
initSuperAdminTenantsPage();
initSuperAdminBarbershopFormPage();
initAdminFinanceModuleCards();
initBarberHomePage();
initGlobalNavigation();
