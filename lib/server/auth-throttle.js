const buckets = new Map();

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!url || !token) return null;
  return { url, token };
}

async function upstashCommand(args) {
  const cfg = getRedisConfig();
  if (!cfg) return null;

  const res = await fetch(`${cfg.url}/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });

  if (!res.ok) throw new Error(`upstash_command_failed_${res.status}`);
  const json = await res.json();
  if (json?.error) throw new Error(json.error);
  return json?.result;
}

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

function registerFailureLocal(input, options = {}) {
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

function isLockedLocal(input) {
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

function resetFailuresLocal(input) {
  const key = keyFrom(input);
  buckets.delete(key);
}

function getAttempts(input) {
  const key = keyFrom(input);
  return getEntry(key);
}

async function registerFailure(input, options = {}) {
  const cfg = getRedisConfig();
  if (!cfg) return registerFailureLocal(input, options);

  const key = keyFrom(input);
  const maxAttempts = Number(options.maxAttempts || 5);
  const windowMs = Number(options.windowMs || 15 * 60 * 1000);
  const lockMs = Number(options.lockMs || 15 * 60 * 1000);
  const attemptsKey = `auth:attempts:${key}`;
  const lockKey = `auth:lock:${key}`;

  try {
    const locked = await upstashCommand(['GET', lockKey]);
    if (locked) {
      const lockTtl = Number(await upstashCommand(['PTTL', lockKey])) || lockMs;
      return {
        allowed: false,
        attempts: maxAttempts,
        lockedUntil: now() + Math.max(1, lockTtl)
      };
    }

    const attempts = Number(await upstashCommand(['INCR', attemptsKey])) || 0;
    if (attempts === 1) await upstashCommand(['PEXPIRE', attemptsKey, windowMs]);

    if (attempts >= maxAttempts) {
      await upstashCommand(['SET', lockKey, '1', 'PX', lockMs]);
      await upstashCommand(['DEL', attemptsKey]);
      return {
        allowed: false,
        attempts,
        lockedUntil: now() + lockMs
      };
    }

    return {
      allowed: true,
      attempts,
      lockedUntil: 0
    };
  } catch {
    return registerFailureLocal(input, options);
  }
}

async function isLocked(input) {
  const cfg = getRedisConfig();
  if (!cfg) return isLockedLocal(input);

  const key = keyFrom(input);
  const lockKey = `auth:lock:${key}`;

  try {
    const locked = await upstashCommand(['GET', lockKey]);
    if (!locked) {
      return {
        locked: false,
        retryAfterMs: 0,
        lockedUntil: 0
      };
    }

    const retryAfterMs = Math.max(0, Number(await upstashCommand(['PTTL', lockKey])) || 0);
    return {
      locked: retryAfterMs > 0,
      retryAfterMs,
      lockedUntil: now() + retryAfterMs
    };
  } catch {
    return isLockedLocal(input);
  }
}

async function resetFailures(input) {
  const cfg = getRedisConfig();
  if (!cfg) return resetFailuresLocal(input);

  const key = keyFrom(input);
  try {
    await upstashCommand(['DEL', `auth:attempts:${key}`, `auth:lock:${key}`]);
  } catch {
    resetFailuresLocal(input);
  }
}

module.exports = {
  registerFailure,
  isLocked,
  resetFailures,
  getAttempts
};
