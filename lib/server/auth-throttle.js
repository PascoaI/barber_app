const buckets = new Map();

function now() {
  return Date.now();
}

function keyFrom(input) {
  return String(input || '').trim().toLowerCase();
}

function getEntry(key) {
  const current = buckets.get(key);
  if (!current) return { attempts: [], lockedUntil: 0 };
  return current;
}

function setEntry(key, entry) {
  buckets.set(key, entry);
}

function clearOldAttempts(attempts, windowMs, nowMs) {
  return attempts.filter((ts) => nowMs - ts <= windowMs);
}

function registerFailure(input, options = {}) {
  const key = keyFrom(input);
  const nowMs = now();
  const maxAttempts = Number(options.maxAttempts || 5);
  const windowMs = Number(options.windowMs || 15 * 60 * 1000);
  const lockMs = Number(options.lockMs || 15 * 60 * 1000);

  const current = getEntry(key);
  const attempts = clearOldAttempts(current.attempts || [], windowMs, nowMs);
  attempts.push(nowMs);

  const shouldLock = attempts.length >= maxAttempts;
  const lockedUntil = shouldLock ? nowMs + lockMs : Number(current.lockedUntil || 0);
  setEntry(key, { attempts, lockedUntil });

  return {
    allowed: !shouldLock,
    attempts: attempts.length,
    lockedUntil
  };
}

function isLocked(input) {
  const key = keyFrom(input);
  const current = getEntry(key);
  const nowMs = now();
  const lockedUntil = Number(current.lockedUntil || 0);
  return {
    locked: lockedUntil > nowMs,
    retryAfterMs: Math.max(0, lockedUntil - nowMs),
    lockedUntil
  };
}

function resetFailures(input) {
  const key = keyFrom(input);
  buckets.delete(key);
}

function getAttempts(input) {
  const key = keyFrom(input);
  return getEntry(key);
}

module.exports = {
  registerFailure,
  isLocked,
  resetFailures,
  getAttempts
};
