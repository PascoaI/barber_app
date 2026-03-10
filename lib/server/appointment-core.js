function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function canCreateInitialStatus(status) {
  return ['pending', 'awaiting_payment', 'confirmed'].includes(status);
}

function toUtcIso(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}


function isValidStatusTransition(from, to) {
  if (from === to) return true;
  const transitions = {
    awaiting_payment: ['pending', 'confirmed', 'canceled'],
    pending: ['confirmed', 'canceled', 'completed', 'no_show'],
    confirmed: ['completed', 'canceled', 'no_show'],
    canceled: [],
    completed: [],
    no_show: []
  };
  return (transitions[from] || []).includes(to);
}

function isFutureOrPresentUtc(isoDatetime, now = new Date()) {
  const parsed = new Date(isoDatetime);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() >= now.getTime();
}

function getMinutesToStart(startDatetime, now = new Date()) {
  const parsed = new Date(startDatetime);
  if (Number.isNaN(parsed.getTime())) return null;
  return (parsed.getTime() - now.getTime()) / 60000;
}

function isCheckInWindowOpen(startDatetime, now = new Date(), minMinutes = 20, maxMinutes = 30) {
  const minutesToStart = getMinutesToStart(startDatetime, now);
  if (minutesToStart === null) return false;
  return minutesToStart >= minMinutes && minutesToStart <= maxMinutes;
}

function validateAppointmentCreation(input) {
  const {
    now = new Date(),
    payload,
    existingAppointments = [],
    blockedSlots = [],
    blockedUntil = null,
    subscriptionStatus = null
  } = input;

  if (!payload?.idempotency_key) return { ok: false, reason: 'missing_idempotency_key' };
  if (!payload?.tenant_id || !payload?.unit_id) return { ok: false, reason: 'missing_tenant_or_unit' };
  if (!payload?.barber_id) return { ok: false, reason: 'missing_barber_id' };
  if (!payload?.start_datetime || !payload?.end_datetime) return { ok: false, reason: 'missing_datetimes' };
  if (!canCreateInitialStatus(payload?.status || 'pending')) return { ok: false, reason: 'invalid_initial_status' };

  if (blockedUntil && new Date(blockedUntil) > now) return { ok: false, reason: 'client_blocked' };
  if (subscriptionStatus && subscriptionStatus !== 'active') return { ok: false, reason: 'subscription_inactive' };

  const startIso = toUtcIso(payload.start_datetime);
  const endIso = toUtcIso(payload.end_datetime);
  if (!startIso || !endIso) return { ok: false, reason: 'invalid_datetimes' };

  const start = new Date(startIso);
  const end = new Date(endIso);
  if (end <= start) return { ok: false, reason: 'invalid_datetime_range' };

  const hasOverlap = existingAppointments.some((a) => {
    if (!['awaiting_payment', 'pending', 'confirmed'].includes(a.status)) return false;
    return overlaps(start, end, new Date(a.start_datetime), new Date(a.end_datetime));
  });
  if (hasOverlap) return { ok: false, reason: 'appointment_overlap' };

  const hasBlockedConflict = blockedSlots.some((b) => overlaps(start, end, new Date(b.start_datetime), new Date(b.end_datetime)));
  if (hasBlockedConflict) return { ok: false, reason: 'blocked_slot_conflict' };

  return {
    ok: true,
    normalized: {
      ...payload,
      start_datetime: startIso,
      end_datetime: endIso
    }
  };
}

module.exports = {
  overlaps,
  canCreateInitialStatus,
  toUtcIso,
  isValidStatusTransition,
  isFutureOrPresentUtc,
  getMinutesToStart,
  isCheckInWindowOpen,
  validateAppointmentCreation
};
