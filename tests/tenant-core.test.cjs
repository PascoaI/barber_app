const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canAccessTenantScope,
  ensureTenantSlug,
  getPathTenantSlug,
  mapBarbershopStatusToTenantStatus,
  mapTenantStatusToBarbershopStatus
} = require('../lib/server/tenant-core.js');

test('ensureTenantSlug normalizes accents and reserved slugs', () => {
  assert.equal(ensureTenantSlug('Barbearia Sao Joao'), 'barbearia-sao-joao');
  assert.equal(ensureTenantSlug('admin'), 'admin-tenant');
});

test('getPathTenantSlug ignores reserved app routes', () => {
  assert.equal(getPathTenantSlug('/admin/home'), '');
  assert.equal(getPathTenantSlug('/minha-barbearia'), 'minha-barbearia');
});

test('tenant status mapping preserves active and inactive lifecycle', () => {
  assert.equal(mapBarbershopStatusToTenantStatus('trial'), 'active');
  assert.equal(mapBarbershopStatusToTenantStatus('disabled'), 'inactive');
  assert.equal(mapTenantStatusToBarbershopStatus('active', 'trial'), 'trial');
  assert.equal(mapTenantStatusToBarbershopStatus('inactive', 'active'), 'disabled');
});

test('canAccessTenantScope enforces tenant isolation with superadmin override', () => {
  assert.equal(canAccessTenantScope({ role: 'admin', barbershopId: 't1' }, 't1'), true);
  assert.equal(canAccessTenantScope({ role: 'admin', barbershopId: 't1' }, 't2'), false);
  assert.equal(canAccessTenantScope({ role: 'super_admin', barbershopId: null }, 't2'), true);
});
