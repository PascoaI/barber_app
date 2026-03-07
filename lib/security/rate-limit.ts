type Bucket = {
  hits: number[];
  blockedUntil: number;
};

const buckets = new Map<string, Bucket>();

export function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const realIp = req.headers.get('x-real-ip') || '';
  const candidate = forwarded.split(',')[0]?.trim() || realIp.trim() || 'unknown';
  return candidate || 'unknown';
}

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  blockMs?: number;
}) {
  const now = Date.now();
  const key = String(input.key || 'unknown');
  const current = buckets.get(key) || { hits: [], blockedUntil: 0 };

  if (current.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterMs: current.blockedUntil - now
    };
  }

  const kept = current.hits.filter((ts) => now - ts <= input.windowMs);
  kept.push(now);
  current.hits = kept;

  if (kept.length > input.limit) {
    const blockMs = Number(input.blockMs || 0);
    if (blockMs > 0) current.blockedUntil = now + blockMs;
    buckets.set(key, current);
    return {
      allowed: false,
      retryAfterMs: blockMs || input.windowMs
    };
  }

  buckets.set(key, current);
  return {
    allowed: true,
    retryAfterMs: 0
  };
}
