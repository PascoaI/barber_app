const RESERVED_TENANT_SEGMENTS = new Set([
  '',
  'admin',
  'api',
  'barber',
  'booking',
  'client',
  'favicon.ico',
  'login',
  'privacy',
  'register',
  'superadmin',
  'terms',
  '_next'
]);

function sanitizeText(value, maxLength = 200) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function sanitizeMultilineText(value, maxLength = 1200) {
  return String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => sanitizeText(line, 240))
    .filter(Boolean)
    .join('\n')
    .slice(0, maxLength);
}

function normalizeTenantSlug(value) {
  const base = sanitizeText(value, 120)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return base.slice(0, 60);
}

function isReservedTenantSlug(value) {
  return RESERVED_TENANT_SEGMENTS.has(normalizeTenantSlug(value));
}

function ensureTenantSlug(value, fallback = 'barbearia') {
  const normalized = normalizeTenantSlug(value) || normalizeTenantSlug(fallback) || 'barbearia';
  if (!isReservedTenantSlug(normalized)) return normalized;
  return `${normalized}-tenant`;
}

function normalizeTenantLifecycleStatus(value) {
  const normalized = sanitizeText(value, 40).toLowerCase();
  if (normalized === 'inactive') return 'inactive';
  return 'active';
}

function mapBarbershopStatusToTenantStatus(value) {
  const normalized = sanitizeText(value, 40).toLowerCase();
  if (normalized === 'active' || normalized === 'trial') return 'active';
  return 'inactive';
}

function mapTenantStatusToBarbershopStatus(value, currentStatus) {
  const tenantStatus = normalizeTenantLifecycleStatus(value);
  const current = sanitizeText(currentStatus, 40).toLowerCase();
  if (tenantStatus === 'inactive') {
    if (current === 'suspended' || current === 'disabled') return current;
    return 'disabled';
  }
  if (current === 'trial' || current === 'active') return current || 'active';
  return 'active';
}

function getPathTenantSlug(pathname) {
  const firstSegment = String(pathname || '')
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .filter(Boolean)[0] || '';
  const normalized = normalizeTenantSlug(firstSegment);
  if (!normalized || isReservedTenantSlug(normalized)) return '';
  return normalized;
}

function buildWhatsAppHref(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : 'https://wa.me/';
}

function canAccessTenantScope(session, tenantId) {
  if (!session) return false;
  if (!tenantId) return String(session.role || '') === 'super_admin';
  if (String(session.role || '') === 'super_admin') return true;
  return String(session.barbershopId || session.tenantId || '') === String(tenantId);
}

module.exports = {
  canAccessTenantScope,
  RESERVED_TENANT_SEGMENTS,
  buildWhatsAppHref,
  ensureTenantSlug,
  getPathTenantSlug,
  isReservedTenantSlug,
  mapBarbershopStatusToTenantStatus,
  mapTenantStatusToBarbershopStatus,
  normalizeTenantLifecycleStatus,
  normalizeTenantSlug,
  sanitizeMultilineText,
  sanitizeText
};
