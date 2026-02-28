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
    { id: 'hidratacao', name: 'Hidratação', duration_minutes: 60, price: 58, barber_id: null, unit_id: DEFAULT_UNIT_ID, requires_pre_payment: false, emoji: '💧' }
  ],
  serviceProducts: [
    { service_id: 'corte', product_id: 'pomada', quantity: 1 },
    { service_id: 'hidratacao', product_id: 'mascara', quantity: 1 }
  ]
};

const BASE_USERS = [
  { email: 'cliente@barber.com', password: '123456', role: 'client', name: 'Cliente', unit_id: DEFAULT_UNIT_ID },
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
  clientProfiles: 'barberpro_client_profiles'
};

const APPOINTMENT_STATUS = ['awaiting_payment', 'pending', 'confirmed', 'canceled', 'completed'];

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
const TEST_MODE_ALLOW_ANY_CANCELLATION = true;
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

function confirmAction(message) {
  return window.confirm(message);
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
  setJson(STORAGE_KEYS.session, {
    email: user.email,
    role: user.role,
    name: user.name,
    barberId: user.barberId || null,
    unit_id: user.unit_id || DEFAULT_UNIT_ID,
    expires_at: addMinutes(new Date(), SESSION_TTL_MINUTES).toISOString()
  });
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function sanitizeText(value) {
  return String(value || '').replace(/[<>]/g, '').trim();
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
    a.status = wasPaid ? 'completed' : 'no_show';
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
  const blockedUntil = getBlockedUntil(session?.email || '');
  if (blockedUntil && new Date(blockedUntil) > new Date()) return null;
  const service = getServiceById(booking.service);
  const barbers = getBarbers(true);

  let barberId = booking.professional;
  if (barberId === 'sem-preferencia') {
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
      updated_by: session?.email || 'system'
    };
  } finally {
    releaseLock(lockName);
  }
}

function updateAppointmentStatus(id, status) {
  if (!APPOINTMENT_STATUS.includes(status)) return;
  const rows = getAppointments();
  const idx = rows.findIndex((a) => a.id === id);
  if (idx < 0) return;

  const beforeState = { ...rows[idx] };
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
  const today = '2026-02-26';
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
  const today = '2026-02-26';
  const todayAppointments = appointments.filter((a) => a.appointment_date === today);
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
    revenueToday: todayPayments.reduce((s, p) => s + Number(p.amount || 0), 0),
    busiestHour: Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
    topService: Object.entries(byService).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
  };
  });
}

function renderMetrics(container, metrics) {
  container.innerHTML = `
    <article class="schedule-item"><h3>Agendamentos hoje</h3><p>${metrics.totalToday}</p></article>
    <article class="schedule-item"><h3>Faturamento do dia</h3><p>${asCurrency(metrics.revenueToday)}</p></article>
    <article class="schedule-item"><h3>Horário mais movimentado</h3><p>${metrics.busiestHour}</p></article>
    <article class="schedule-item"><h3>Serviço mais vendido</h3><p>${metrics.topService}</p></article>
  `;
}

function initLoginPage() {
  const form = document.querySelector('form.auth-form');
  if (!form) return;
  const feedback = document.getElementById('login-feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';

    const base = BASE_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    const barber = getBarbers().find((b) => b.email.toLowerCase() === email.toLowerCase() && b.password === password && b.active);

    const user = base || (barber ? { email: barber.email, password: barber.password, role: 'barber', name: barber.name, barberId: barber.id, unit_id: barber.unit_id } : null);

    if (!user) {
      if (feedback) feedback.textContent = 'Credenciais inválidas.';
      return;
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
  if (!session) action.textContent = 'Efetuar login para continuar';
  else if (!hasRole('client')) action.textContent = 'Perfil administrativo não agenda por esta tela';
  else if (!canClientBook(session.email)) action.textContent = 'Cliente bloqueado temporariamente';
  else action.textContent = 'Confirmar agendamento';

  const successModal = document.getElementById('booking-success-modal');
  const successHomeBtn = document.getElementById('booking-success-home');

  action.addEventListener('click', () => {
    const currentSession = getSession();
    if (!currentSession) return (window.location.href = 'login.html?redirect=booking-review.html');
    if (!hasRole('client')) return;
    if (!canClientBook(currentSession.email)) return;

    const apt = createAppointmentFromBooking();
    if (!apt) {
      action.textContent = 'Horário indisponível. Escolha outro.';
      return;
    }

    const rows = getAppointments();
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
      successModal.classList.add('is-open');
      successModal.setAttribute('aria-hidden', 'false');
    }

    if (successHomeBtn) {
      successHomeBtn.onclick = () => {
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
    btn.addEventListener('click', () => {
      const apt = appointments.find((a) => a.id === btn.dataset.cancel);
      if (!apt) return;
      const allowed = canCancelAppointment(apt);
      if (!allowed) {
        alert('Cancelamento fora da política: prazo mínimo não respeitado.');
        return;
      }
      if (!confirmAction('Deseja realmente cancelar este agendamento?')) return;
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
  if (!metricsEl || !detailsEl) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const analytics = getAnalytics();
  const metrics = getDashboardMetrics();
  renderMetrics(metricsEl, metrics);

  const toolbar = document.createElement('div');
  toolbar.className = 'form-row';
  toolbar.innerHTML = `
    <button class="button button-secondary" type="button" data-export="revenue">Exportar faturamento CSV</button>
    <button class="button button-secondary" type="button" data-export="commissions">Exportar comissões CSV</button>
    <button class="button button-secondary" type="button" data-export="clients">Exportar clientes ativos CSV</button>
    <button class="button button-secondary" type="button" data-export="stock">Exportar estoque CSV</button>
  `;
  detailsEl.before(toolbar);

  const completed = getAppointments().filter((a) => a.status === 'completed');
  const byBarber = {};
  completed.forEach((a) => {
    byBarber[a.barber_name] = (byBarber[a.barber_name] || 0) + Number(a.service_price || 0);
  });

  const monthly = getJson(STORAGE_KEYS.payments, [])
    .filter((p) => p.unit_id === APP_CONFIG.unitId && p.status === 'paid' && (p.paid_at || '').slice(0, 7) === '2026-02')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const avgTicket = completed.length ? completed.reduce((s, a) => s + Number(a.service_price || 0), 0) / completed.length : 0;

  detailsEl.innerHTML = `
    <article class="schedule-item"><h3>Faturamento mensal</h3><p>${asCurrency(monthly)}</p></article>
    <article class="schedule-item"><h3>Ticket médio</h3><p>${asCurrency(avgTicket)}</p></article>
    <article class="schedule-item"><h3>Horário mais lucrativo</h3><p>${analytics.profitableHour}</p></article>
    <article class="schedule-item"><h3>Dia com maior faturamento</h3><p>${analytics.bestWeekDay}</p></article>
    <article class="schedule-item"><h3>Cliente com maior frequência</h3><p>${analytics.topClient}</p></article>
    ${Object.entries(byBarber)
      .map(([name, amount]) => `<article class="schedule-item"><h3>Receita por barbeiro · ${name}</h3><p>${asCurrency(amount)}</p></article>`)
      .join('') || '<article class="schedule-item"><h3>Receita por barbeiro</h3><p>Sem dados</p></article>'}
  `;

  toolbar.querySelectorAll('[data-export]').forEach((btn) => {
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
        getAppointments().forEach((a) => {
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
    alertCard.className = 'schedule-item';
    alertCard.innerHTML = `<h3>⚠️ Alerta de estoque baixo</h3><p>${alerts}</p>`;
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

  const renderAppointments = (rows, title) => {
    if (!appointmentsRoot) return;
    const list = rows
      .slice(0, 5)
      .map((a) => `<article class="schedule-item"><h3>${a.service_name}</h3><p>${formatBookingDateTime(a.appointment_date, a.start_time)} · ${a.barber_name}</p><small>Status: ${getBookingStatusLabel(a.status)}</small></article>`)
      .join('');
    appointmentsRoot.innerHTML = `
      <header class="flex items-center justify-between mb-3"><h3>${title}</h3><small class="text-text-secondary">${rows.length} registros</small></header>
      <div class="grid gap-2">${list || '<article class="schedule-item"><p>Sem agendamentos no período.</p></article>'}</div>
    `;
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
      <header class="flex items-center justify-between mb-3"><h3>Resumo financeiro (${label})</h3><small class="text-text-secondary">Atualizado agora</small></header>
      <div class="grid gap-2 md:grid-cols-2">
        <article class="schedule-item"><h3>Faturamento</h3><p>${asCurrency(revenue)}</p></article>
        <article class="schedule-item"><h3>Ticket médio</h3><p>${asCurrency(avgTicket)}</p></article>
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

    if (tab === 'today') {
      renderAppointments(todayAppointments, 'Agendamentos de hoje');
      renderFinance(revenueToday, todayAppointments.length, 'Hoje');
    } else {
      renderAppointments(weekAppointments, 'Agendamentos da semana');
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

  const lastCompleted = appointments
    .filter((a) => a.status === 'completed')
    .sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime))[0];

  const metrics = document.getElementById('client-quick-metrics');
  if (metrics) metrics.innerHTML = '';

  const nextWrap = document.getElementById('client-next-appointment');
  if (nextWrap) {
    if (!next) {
      nextWrap.innerHTML = `<article class="schedule-item"><h3>Próximo agendamento</h3><p>Nenhum horário futuro encontrado.</p><div class="form-row"><a class="button button-primary" href="booking-location.html">Agendar agora</a><button class="button button-secondary" data-client-repeat ${lastCompleted ? '' : 'disabled title="Sem histórico concluído"'}>Repetir último corte</button></div></article>`;
      nextWrap.querySelector('[data-client-repeat]')?.addEventListener('click', () => {
        if (!lastCompleted) return;
        const city = BASE_DATA.cities.find((c) => c.name === lastCompleted.city);
        const branch = city?.branches.find((x) => x.name === lastCompleted.branch);
        saveBooking({ city: city?.id || 'poa', branch: branch?.id || 'bom-fim', service: lastCompleted.service_id, professional: lastCompleted.barber_id });
        window.location.href = 'booking-datetime.html?prefill=last-cut';
      });
    } else {
      nextWrap.innerHTML = `<article class="schedule-item"><h3>Próximo agendamento</h3><p>${formatBookingDateTime(next.appointment_date, next.start_time)} · ${next.service_name}</p><small>${next.barber_name} · ${next.branch} · status ${getBookingStatusLabel(next.status)}</small><div class="form-row"><button class="button button-secondary" data-client-repeat ${lastCompleted ? '' : 'disabled title="Sem histórico concluído"'}>Repetir último corte</button><button class="button button-secondary" data-client-reschedule="${next.id}">Reagendar</button><button class="button button-secondary" data-client-cancel="${next.id}">Cancelar</button></div></article>`;
      nextWrap.querySelector('[data-client-repeat]')?.addEventListener('click', () => {
        if (!lastCompleted) return;
        const city = BASE_DATA.cities.find((c) => c.name === lastCompleted.city);
        const branch = city?.branches.find((x) => x.name === lastCompleted.branch);
        saveBooking({ city: city?.id || 'poa', branch: branch?.id || 'bom-fim', service: lastCompleted.service_id, professional: lastCompleted.barber_id });
        window.location.href = 'booking-datetime.html?prefill=last-cut';
      });
      nextWrap.querySelector('[data-client-reschedule]')?.addEventListener('click', () => {
        const city = BASE_DATA.cities.find((c) => c.name === next.city);
        const branch = city?.branches.find((x) => x.name === next.branch);
        saveBooking({ city: city?.id || 'poa', branch: branch?.id || 'bom-fim', service: next.service_id, professional: next.barber_id, date: next.appointment_date, time: next.start_time, edit_appointment_id: next.id });
        window.location.href = 'booking-datetime.html?edit=datetime';
      });
      nextWrap.querySelector('[data-client-cancel]')?.addEventListener('click', () => {
        if (!confirmAction('Deseja realmente cancelar este agendamento?')) return;
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
  const colorEl = document.getElementById('shop-color');
  const logoUrlEl = document.getElementById('shop-logo-url');
  const logoFileEl = document.getElementById('shop-logo-file');
  const previewName = document.getElementById('brand-preview-name');
  const previewLogo = document.getElementById('brand-preview-logo');

  const brand = getBrandSettings();
  nameEl.value = brand.shopName;
  colorEl.value = brand.primaryColor;
  logoUrlEl.value = brand.logoUrl;

  const updatePreview = (logo) => {
    previewName.textContent = nameEl.value || 'BarberPro';
    if (logo) {
      previewLogo.src = logo;
      previewLogo.style.display = 'block';
    } else previewLogo.style.display = 'none';
  };

  updatePreview(brand.logoUrl);
  nameEl.addEventListener('input', () => updatePreview(logoUrlEl.value));
  logoUrlEl.addEventListener('input', () => updatePreview(logoUrlEl.value));
  logoFileEl.addEventListener('change', () => {
    const file = logoFileEl.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      logoUrlEl.value = String(reader.result || '');
      updatePreview(logoUrlEl.value);
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveBrandSettings({ shopName: nameEl.value.trim() || 'BarberPro', primaryColor: colorEl.value, logoUrl: logoUrlEl.value.trim() });
    applyBrandTheme();
    logAudit('brand_updated', { shopName: nameEl.value.trim() });
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
    btn.addEventListener('click', () => {
      const plan = plans.find((x) => x.id === btn.dataset.subscribe);
      if (!plan) return;
      if (!confirmAction(`Confirmar assinatura do ${plan.name} por ${asCurrency(plan.price)} / mês?`)) return;
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
  nameEl.value = profile.name || '';
  emailEl.value = profile.email || session.email;
  phoneEl.value = profile.phone || '';
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
    feedback.textContent = 'Perfil salvo com sucesso.';
  });
}

function createClientNotificationsBell(session) {
  if (!session || session.role !== 'client') return null;

  const bellBtn = document.createElement('button');
  bellBtn.type = 'button';
  bellBtn.className = 'button button-secondary quick-menu-trigger inline-flex items-center justify-center rounded-xl px-3 min-h-10';
  bellBtn.setAttribute('aria-label', 'Notificações (em breve)');
  bellBtn.title = 'Notificações (em breve)';
  bellBtn.textContent = '🔔';

  return { bellBtn };
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

function initSuperAdminTenantsPage() {
  const root = document.getElementById('tenants-root');
  if (!root) return;
  if (!requireRole(['super_admin'], 'login.html')) return;

  const tenants = getJson(STORAGE_KEYS.tenants, []);
  const plans = getJson(STORAGE_KEYS.platformPlans, []);

  root.innerHTML = tenants
    .map((t) => {
      const plan = plans.find((p) => p.id === t.subscription_plan_id);
      return `<article class="schedule-item"><h3>${t.name}</h3><p>Plano: ${plan?.name || '-'} · Status: ${t.subscription_status}</p><small>Recursos: analytics=${plan?.analytics_enabled ? 'on' : 'off'}, estoque=${plan?.stock_enabled ? 'on' : 'off'}, assinatura=${plan?.subscription_enabled ? 'on' : 'off'}</small></article>`;
    })
    .join('');
}

function initAdminFinanceModuleCards() {
  const cardWrap = document.getElementById('finance-by-barber');
  if (!cardWrap) return;
  const occupancy = getAnalytics().occupancyByBarber;
  if (Object.keys(occupancy).length) {
    cardWrap.innerHTML += Object.entries(occupancy)
      .map(([name, count]) => `<article class="schedule-item"><h3>Ocupação média (hoje) · ${name}</h3><p>${count} slots</p></article>`)
      .join('');
  }
}

function initBarberHomePage() {
  if (!document.title.includes('Painel Barbeiro')) return;
  requireRole(['barber'], 'login.html');
}

function dbEnabled() {
  return Boolean(DB_CONFIG.supabaseUrl && DB_CONFIG.supabaseAnonKey);
}

function ensureDbSchemaNote() {
  if (dbEnabled()) {
    // placeholder para integração backend real / transações
  }
}


function initGlobalNavigation() {
  const session = getSession();

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
    nav.classList.remove('justify-end');
    nav.classList.add('justify-between', 'items-center');

    const home = nav.querySelector('[data-home]');
    const back = nav.querySelector('[data-back]');

    if (back) {
      back.innerHTML = '←';
      back.setAttribute('aria-label', 'Voltar');
      back.classList.add('!w-10', '!min-h-10', '!px-0', 'rounded-full', 'text-lg');
      back.onclick = () => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = session?.role === 'client' ? 'client-home.html' : 'index.html';
      };
    }

    if (home) {
      home.innerHTML = '🏠';
      home.setAttribute('aria-label', 'Home');
      home.classList.add('!w-10', '!min-h-10', '!px-0', 'rounded-full', 'text-lg');
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
    menuBtn.className = 'button button-secondary quick-menu-trigger inline-flex items-center justify-center rounded-xl px-3 min-h-10';
    menuBtn.setAttribute('aria-label', 'Abrir menu');
    menuBtn.textContent = '☰';

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
      if (el.matches('[data-logout]')) {
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
    if (!panel.children.length) return;

    const right = document.createElement('div');
    right.className = 'quick-nav-right relative';

    const notifications = createClientNotificationsBell(session);
    if (notifications) {
      right.appendChild(notifications.bellBtn);
    }

    right.appendChild(menuBtn);
    right.appendChild(panel);
    nav.appendChild(right);

    menuBtn.addEventListener('click', () => {
      panel.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
      if (!right.contains(e.target)) {
        panel.classList.remove('is-open');
      }
    });
  });
}

ensureSeed();
checkOverduePrepayments();
autoUpdateAppointmentStatuses();
applyBrandTheme();
ensureDbSchemaNote();

initLoginPage();
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
initAdminFinanceModuleCards();
initBarberHomePage();
initGlobalNavigation();
