const DEFAULT_PLAN_PRICES = {
  free: 0,
  basic: 89,
  pro: 149,
  enterprise: 299
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDateRange(period, now = new Date()) {
  const start = startOfDay(now);
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
  end.setDate(1);
  end.setMonth(start.getMonth() + 1);
  return { start, end, label: 'Mes' };
}

function isInRange(value, range) {
  const parsed = new Date(value || 0);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= range.start && parsed < range.end;
}

function normalizeStatus(status) {
  return String(status || '').toLowerCase();
}

function isCompletedStatus(status) {
  return normalizeStatus(status) === 'completed';
}

function isCanceledStatus(status) {
  const value = normalizeStatus(status);
  return value === 'canceled' || value === 'cancelled';
}

function isOpenStatus(status) {
  return ['pending', 'confirmed', 'awaiting_payment', 'scheduled'].includes(normalizeStatus(status));
}

function resolveAppointmentPrice(row) {
  return Math.max(
    toNumber(row?.service_price),
    toNumber(row?.services?.price),
    toNumber(row?.price),
    0
  );
}

function resolveServiceName(row) {
  return String(row?.service_name || row?.services?.name || 'Servico');
}

function resolveBarberName(row) {
  return String(row?.barber_name || row?.barbers?.name || row?.barbers?.users?.name || 'Sem barbeiro');
}

function resolveAppointmentDate(row) {
  return row?.start_datetime || row?.appointment_date || row?.created_at || null;
}

function buildRankRows(groupedMap, limit = 5) {
  const sorted = Object.entries(groupedMap).sort((a, b) => b[1] - a[1]).slice(0, limit);
  const topAmount = sorted[0] ? toNumber(sorted[0][1]) : 0;
  return sorted.map(([name, amount]) => {
    const parsedAmount = toNumber(amount);
    return {
      name,
      amount: parsedAmount,
      percentage: topAmount > 0 ? (parsedAmount / topAmount) * 100 : 0
    };
  });
}

function buildDailySeries(range, completedRows) {
  const days = [];
  for (const cursor = new Date(range.start); cursor < range.end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(new Date(cursor));
  }

  const series = days.map((day) => {
    const dayKey = day.toISOString().slice(0, 10);
    const amount = completedRows
      .filter((row) => {
        const dateValue = resolveAppointmentDate(row);
        return String(dateValue || '').slice(0, 10) === dayKey;
      })
      .reduce((sum, row) => sum + resolveAppointmentPrice(row), 0);
    return {
      key: dayKey,
      label: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      amount
    };
  });

  const maxAmount = Math.max(0, ...series.map((row) => row.amount));
  return {
    maxAmount,
    rows: series.map((row) => ({
      ...row,
      percentage: maxAmount > 0 ? (row.amount / maxAmount) * 100 : 0
    }))
  };
}

function buildFinanceSnapshot({ appointments = [], period = 'today', now = new Date() }) {
  const range = getDateRange(period, now);
  const periodRows = appointments.filter((row) => isInRange(resolveAppointmentDate(row), range));
  const completedRows = periodRows.filter((row) => isCompletedStatus(row.status));
  const canceledRows = periodRows.filter((row) => isCanceledStatus(row.status));
  const queueRows = periodRows.filter((row) => isOpenStatus(row.status));

  const completedRevenue = completedRows.reduce((sum, row) => sum + resolveAppointmentPrice(row), 0);
  const expectedRevenue = queueRows.reduce((sum, row) => sum + resolveAppointmentPrice(row), 0);
  const ticketAverage = completedRows.length > 0 ? completedRevenue / completedRows.length : 0;
  const cancellationRate = periodRows.length > 0 ? (canceledRows.length / periodRows.length) * 100 : 0;

  const byBarberMap = {};
  completedRows.forEach((row) => {
    const name = resolveBarberName(row);
    byBarberMap[name] = toNumber(byBarberMap[name]) + resolveAppointmentPrice(row);
  });

  const byServiceMap = {};
  completedRows.forEach((row) => {
    const name = resolveServiceName(row);
    byServiceMap[name] = toNumber(byServiceMap[name]) + resolveAppointmentPrice(row);
  });

  const dailySeries = buildDailySeries(range, completedRows);
  return {
    period,
    label: range.label,
    rangeStart: range.start.toISOString(),
    rangeEnd: range.end.toISOString(),
    totals: {
      totalAppointments: periodRows.length,
      completedCount: completedRows.length,
      canceledCount: canceledRows.length,
      queueCount: queueRows.length,
      completedRevenue,
      expectedRevenue,
      ticketAverage,
      cancellationRate
    },
    byBarber: buildRankRows(byBarberMap),
    byService: buildRankRows(byServiceMap),
    daily: dailySeries.rows
  };
}

function resolveSubscriptionName(row) {
  return String(row?.subscription_plans?.name || row?.plan || row?.plan_id || 'Sem plano');
}

function resolveSubscriptionPrice(row, customPlanPrices = {}) {
  const fromRelation = toNumber(row?.subscription_plans?.price);
  if (fromRelation > 0) return fromRelation;

  const normalizedPlan = String(row?.plan || '').toLowerCase();
  if (toNumber(customPlanPrices[row?.plan]) > 0) return toNumber(customPlanPrices[row?.plan]);
  if (toNumber(customPlanPrices[row?.plan_id]) > 0) return toNumber(customPlanPrices[row?.plan_id]);
  if (toNumber(customPlanPrices[normalizedPlan]) > 0) return toNumber(customPlanPrices[normalizedPlan]);
  return toNumber(DEFAULT_PLAN_PRICES[normalizedPlan]);
}

function resolveSubscriptionDate(row) {
  return row?.started_at || row?.created_at || null;
}

function isSubscriptionActive(status) {
  return normalizeStatus(status) === 'active';
}

function isSubscriptionTrial(status) {
  return normalizeStatus(status) === 'trial';
}

function isSubscriptionSuspended(status) {
  return normalizeStatus(status) === 'suspended';
}

function isSubscriptionDisabled(status) {
  return ['disabled', 'canceled', 'cancelled'].includes(normalizeStatus(status));
}

function buildSubscriptionSnapshot({ subscriptions = [], period = 'today', now = new Date(), planPrices = {} }) {
  const range = getDateRange(period, now);
  const periodRows = subscriptions.filter((row) => isInRange(resolveSubscriptionDate(row), range));
  const activeRows = subscriptions.filter((row) => isSubscriptionActive(row.status));
  const trialRows = subscriptions.filter((row) => isSubscriptionTrial(row.status));
  const suspendedRows = subscriptions.filter((row) => isSubscriptionSuspended(row.status));
  const disabledRows = subscriptions.filter((row) => isSubscriptionDisabled(row.status));

  const mrr = activeRows.reduce((sum, row) => sum + resolveSubscriptionPrice(row, planPrices), 0);
  const periodRevenue = periodRows
    .filter((row) => isSubscriptionActive(row.status) || isSubscriptionTrial(row.status))
    .reduce((sum, row) => sum + resolveSubscriptionPrice(row, planPrices), 0);

  const periodNewCount = periodRows.filter((row) => !isSubscriptionDisabled(row.status)).length;
  const churnInPeriodCount = periodRows.filter((row) => isSubscriptionDisabled(row.status) || isSubscriptionSuspended(row.status)).length;
  const arpu = activeRows.length > 0 ? mrr / activeRows.length : 0;

  const byPlanMap = {};
  const byPlanPeriodMap = {};
  subscriptions.forEach((row) => {
    const planName = resolveSubscriptionName(row);
    const price = resolveSubscriptionPrice(row, planPrices);
    if (!byPlanMap[planName]) {
      byPlanMap[planName] = { subscribers: 0, revenue: 0 };
    }
    if (isSubscriptionActive(row.status) || isSubscriptionTrial(row.status)) {
      byPlanMap[planName].subscribers += 1;
      byPlanMap[planName].revenue += price;
    }

    if (isInRange(resolveSubscriptionDate(row), range) && (isSubscriptionActive(row.status) || isSubscriptionTrial(row.status))) {
      if (!byPlanPeriodMap[planName]) {
        byPlanPeriodMap[planName] = { subscribers: 0, revenue: 0 };
      }
      byPlanPeriodMap[planName].subscribers += 1;
      byPlanPeriodMap[planName].revenue += price;
    }
  });

  const topPlansBySubscribers = Object.entries(byPlanMap)
    .map(([name, values]) => ({
      name,
      subscribers: toNumber(values.subscribers),
      revenue: toNumber(values.revenue)
    }))
    .sort((a, b) => b.subscribers - a.subscribers)
    .slice(0, 6);

  const topPlansByRevenue = [...topPlansBySubscribers]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const plansInPeriod = Object.entries(byPlanPeriodMap)
    .map(([name, values]) => ({
      name,
      subscribers: toNumber(values.subscribers),
      revenue: toNumber(values.revenue)
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const nowMs = now.getTime();
  const expiringSoon = activeRows
    .filter((row) => {
      const expirationMs = new Date(row?.expires_at || 0).getTime();
      if (!Number.isFinite(expirationMs)) return false;
      const delta = expirationMs - nowMs;
      return delta >= 0 && delta <= 7 * 24 * 60 * 60 * 1000;
    })
    .slice(0, 8)
    .map((row) => ({
      id: row.id,
      plan: resolveSubscriptionName(row),
      expiresAt: row.expires_at || null
    }));

  return {
    period,
    label: range.label,
    rangeStart: range.start.toISOString(),
    rangeEnd: range.end.toISOString(),
    totals: {
      totalSubscriptions: subscriptions.length,
      activeCount: activeRows.length,
      trialCount: trialRows.length,
      suspendedCount: suspendedRows.length,
      disabledCount: disabledRows.length,
      newInPeriodCount: periodNewCount,
      churnInPeriodCount,
      periodRevenue,
      mrr,
      arpu
    },
    topPlansBySubscribers,
    topPlansByRevenue,
    plansInPeriod,
    expiringSoon
  };
}

module.exports = {
  getDateRange,
  isInRange,
  buildFinanceSnapshot,
  buildSubscriptionSnapshot
};
