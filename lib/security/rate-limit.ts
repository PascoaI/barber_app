type Bucket = {
  hits: number[];
  blockedUntil: number;
};

const buckets = new Map<string, Bucket>();

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!url || !token) return null;
  return { url, token };
}

async function upstashCommand<T = any>(args: Array<string | number>) {
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

  if (!res.ok) {
    throw new Error(`upstash_command_failed_${res.status}`);
  }

  const json = (await res.json()) as { result?: T; error?: string };
  if (json?.error) throw new Error(json.error);
  return json?.result as T;
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const realIp = req.headers.get('x-real-ip') || '';
  const candidate = forwarded.split(',')[0]?.trim() || realIp.trim() || 'unknown';
  return candidate || 'unknown';
}

function checkRateLimitLocal(input: {
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

export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  blockMs?: number;
}) {
  const cfg = getRedisConfig();
  if (!cfg) return checkRateLimitLocal(input);

  const key = String(input.key || 'unknown');
  const countKey = `rl:count:${key}`;
  const blockKey = `rl:block:${key}`;
  const blockMs = Number(input.blockMs || 0);

  try {
    const blocked = await upstashCommand<string | null>(['GET', blockKey]);
    if (blocked) {
      const ttl = Number(await upstashCommand<number>(['PTTL', blockKey])) || blockMs || input.windowMs;
      return {
        allowed: false,
        retryAfterMs: Math.max(1, ttl)
      };
    }

    const count = Number(await upstashCommand<number>(['INCR', countKey])) || 0;
    if (count === 1) {
      await upstashCommand(['PEXPIRE', countKey, input.windowMs]);
    }

    if (count > input.limit) {
      if (blockMs > 0) {
        await upstashCommand(['SET', blockKey, '1', 'PX', blockMs]);
      }
      const ttl = blockMs > 0
        ? blockMs
        : Number(await upstashCommand<number>(['PTTL', countKey])) || input.windowMs;
      return {
        allowed: false,
        retryAfterMs: Math.max(1, ttl)
      };
    }

    return {
      allowed: true,
      retryAfterMs: 0
    };
  } catch {
    return checkRateLimitLocal(input);
  }
}
