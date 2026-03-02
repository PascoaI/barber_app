const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateAppointmentCreation,
  isValidStatusTransition,
  isFutureOrPresentUtc,
  toUtcIso
} = require('../lib/server/appointment-core');

test('criar agendamento válido', () => {
  const result = validateAppointmentCreation({
    payload: {
      idempotency_key: 'k1',
      tenant_id: 't1',
      unit_id: 'u1',
      barber_id: 'b1',
      start_datetime: '2026-01-10T13:00:00-03:00',
      end_datetime: '2026-01-10T13:30:00-03:00',
      status: 'pending'
    },
    existingAppointments: [],
    blockedSlots: []
  });

  assert.equal(result.ok, true);
  assert.equal(result.normalized.start_datetime, '2026-01-10T16:00:00.000Z');
});

test('clique duplo/idempotência simulada por mesma chave não falha validação', () => {
  const payload = {
    idempotency_key: 'same-key',
    tenant_id: 't1',
    unit_id: 'u1',
    barber_id: 'b1',
    start_datetime: '2026-01-10T16:00:00.000Z',
    end_datetime: '2026-01-10T16:30:00.000Z',
    status: 'pending'
  };

  const first = validateAppointmentCreation({ payload, existingAppointments: [], blockedSlots: [] });
  const second = validateAppointmentCreation({ payload, existingAppointments: [], blockedSlots: [] });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
});

test('bloqueia overlap', () => {
  const result = validateAppointmentCreation({
    payload: {
      idempotency_key: 'k2', tenant_id: 't1', unit_id: 'u1', barber_id: 'b1',
      start_datetime: '2026-01-10T16:10:00.000Z', end_datetime: '2026-01-10T16:40:00.000Z', status: 'pending'
    },
    existingAppointments: [{ status: 'confirmed', start_datetime: '2026-01-10T16:00:00.000Z', end_datetime: '2026-01-10T16:30:00.000Z' }],
    blockedSlots: []
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'appointment_overlap');
});

test('bloqueia blocked slot', () => {
  const result = validateAppointmentCreation({
    payload: {
      idempotency_key: 'k3', tenant_id: 't1', unit_id: 'u1', barber_id: 'b1',
      start_datetime: '2026-01-10T17:10:00.000Z', end_datetime: '2026-01-10T17:40:00.000Z', status: 'pending'
    },
    existingAppointments: [],
    blockedSlots: [{ start_datetime: '2026-01-10T17:00:00.000Z', end_datetime: '2026-01-10T18:00:00.000Z' }]
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'blocked_slot_conflict');
});

test('transição inválida de status', () => {
  assert.equal(isValidStatusTransition('completed', 'pending'), false);
  assert.equal(isValidStatusTransition('pending', 'confirmed'), true);
});

test('próximo agendamento some após passar do horário (timezone-safe UTC)', () => {
  const start = toUtcIso('2026-01-10T13:00:00-03:00');
  assert.equal(start, '2026-01-10T16:00:00.000Z');

  const before = new Date('2026-01-10T15:59:59.000Z');
  const after = new Date('2026-01-10T16:00:01.000Z');

  assert.equal(isFutureOrPresentUtc(start, before), true);
  assert.equal(isFutureOrPresentUtc(start, after), false);
});
