const DEFAULT_UNIT_ID = 'unit_bom_fim';
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

function updateAppointmentStatus(id, status, meta = {}) {
  if (!APPOINTMENT_STATUS.includes(status)) return;
  const rows = getAppointments();
  const idx = rows.findIndex((a) => a.id === id);
  if (idx < 0) return;

  const beforeState = { ...rows[idx] };
  if (!canTransitionAppointmentStatus(rows[idx].status, status)) return;
  if (meta && typeof meta === 'object') {
    rows[idx] = { ...rows[idx], ...meta };
  }
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

