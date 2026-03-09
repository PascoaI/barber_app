const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFinanceSnapshot, buildSubscriptionSnapshot } = require('../lib/server/finance-core');

test('finance snapshot usa apenas concluidos para faturamento e ticket medio', () => {
  const now = new Date('2026-03-09T12:00:00.000Z');
  const appointments = [
    { id: 'a1', start_datetime: '2026-03-09T10:00:00.000Z', status: 'completed', service_price: 80, barber_name: 'Rick', service_name: 'Corte' },
    { id: 'a2', start_datetime: '2026-03-09T11:00:00.000Z', status: 'completed', service_price: 120, barber_name: 'Rick', service_name: 'Barba' },
    { id: 'a3', start_datetime: '2026-03-09T13:00:00.000Z', status: 'confirmed', service_price: 90, barber_name: 'Natan', service_name: 'Hidratacao' },
    { id: 'a4', start_datetime: '2026-03-09T14:00:00.000Z', status: 'canceled', service_price: 90, barber_name: 'Natan', service_name: 'Hidratacao' }
  ];

  const snapshot = buildFinanceSnapshot({ appointments, period: 'today', now });

  assert.equal(snapshot.totals.completedCount, 2);
  assert.equal(snapshot.totals.completedRevenue, 200);
  assert.equal(snapshot.totals.ticketAverage, 100);
  assert.equal(snapshot.totals.queueCount, 1);
  assert.equal(snapshot.totals.expectedRevenue, 90);
  assert.equal(snapshot.totals.canceledCount, 1);
  assert.equal(snapshot.byBarber[0].name, 'Rick');
  assert.equal(snapshot.byService[0].name, 'Barba');
});

test('subscription snapshot calcula mrr, receita do periodo e ranking de planos', () => {
  const now = new Date('2026-03-09T12:00:00.000Z');
  const subscriptions = [
    { id: 's1', status: 'active', plan: 'basic', started_at: '2026-03-09T09:00:00.000Z' },
    { id: 's2', status: 'active', plan: 'pro', started_at: '2026-03-09T10:00:00.000Z' },
    { id: 's3', status: 'trial', plan: 'basic', started_at: '2026-03-09T11:00:00.000Z' },
    { id: 's4', status: 'suspended', plan: 'pro', started_at: '2026-03-09T11:30:00.000Z' },
    { id: 's5', status: 'disabled', plan: 'basic', started_at: '2026-03-09T11:50:00.000Z' }
  ];

  const snapshot = buildSubscriptionSnapshot({
    subscriptions,
    period: 'today',
    now,
    planPrices: { basic: 90, pro: 150 }
  });

  assert.equal(snapshot.totals.activeCount, 2);
  assert.equal(snapshot.totals.trialCount, 1);
  assert.equal(snapshot.totals.suspendedCount, 1);
  assert.equal(snapshot.totals.mrr, 240);
  assert.equal(snapshot.totals.periodRevenue, 330);
  assert.equal(snapshot.totals.newInPeriodCount, 4);
  assert.equal(snapshot.totals.churnInPeriodCount, 2);
  assert.equal(snapshot.topPlansBySubscribers[0].name, 'basic');
  assert.equal(snapshot.topPlansBySubscribers[0].subscribers, 2);
});
