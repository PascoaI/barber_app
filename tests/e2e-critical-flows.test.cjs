const test = require('node:test');
const assert = require('node:assert/strict');

const { validateAppointmentCreation, isValidStatusTransition } = require('../lib/server/appointment-core');
const { mapStripeStatusToTenantStatus } = require('../lib/server/billing-core');
const { canAccessRoute } = require('../lib/server/permissions-core');

test('E2E: agendamento completo (cria -> confirma -> conclui)', () => {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const creation = validateAppointmentCreation({
    payload: {
      idempotency_key: 'flow-booking-1',
      tenant_id: 'shop_1',
      unit_id: 'shop_1',
      barber_id: 'barber_1',
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      status: 'pending'
    },
    existingAppointments: [],
    blockedSlots: []
  });

  assert.equal(creation.ok, true);
  assert.equal(isValidStatusTransition('pending', 'confirmed'), true);
  assert.equal(isValidStatusTransition('confirmed', 'completed'), true);
});

test('E2E: cancelamento permitido a partir de pendente/confirmado', () => {
  assert.equal(isValidStatusTransition('pending', 'canceled'), true);
  assert.equal(isValidStatusTransition('confirmed', 'canceled'), true);
  assert.equal(isValidStatusTransition('completed', 'canceled'), false);
});

test('E2E: no-show permitido para agendamento confirmado', () => {
  assert.equal(isValidStatusTransition('confirmed', 'no_show'), true);
  assert.equal(isValidStatusTransition('pending', 'no_show'), true);
  assert.equal(isValidStatusTransition('canceled', 'no_show'), false);
});

test('E2E: cobranca mapeia status Stripe para status do tenant', () => {
  assert.equal(mapStripeStatusToTenantStatus('active'), 'active');
  assert.equal(mapStripeStatusToTenantStatus('trialing'), 'trial');
  assert.equal(mapStripeStatusToTenantStatus('past_due'), 'suspended');
  assert.equal(mapStripeStatusToTenantStatus('canceled'), 'disabled');
});

test('E2E: permissoes por perfil bloqueiam acesso indevido', () => {
  assert.equal(canAccessRoute({ role: 'client', pathname: '/admin/home' }), false);
  assert.equal(canAccessRoute({ role: 'admin', pathname: '/admin/home' }), true);
  assert.equal(canAccessRoute({ role: 'admin', pathname: '/superadmin/dashboard' }), false);
  assert.equal(canAccessRoute({ role: 'super_admin', pathname: '/superadmin/dashboard' }), true);
});
