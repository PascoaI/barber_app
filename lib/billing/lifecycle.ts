import { mapStripeStatusToTenantStatus } from '@/lib/server/billing-core';

type PlatformPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export function resolvePlanFromPriceId(priceId: string | null | undefined): PlatformPlan {
  const value = String(priceId || '').trim();
  if (!value) return 'basic';

  const byPlan: Array<{ plan: PlatformPlan; envKey: string }> = [
    { plan: 'enterprise', envKey: 'STRIPE_PRICE_ENTERPRISE' },
    { plan: 'pro', envKey: 'STRIPE_PRICE_PRO' },
    { plan: 'basic', envKey: 'STRIPE_PRICE_BASIC' },
    { plan: 'free', envKey: 'STRIPE_PRICE_FREE' }
  ];

  for (const item of byPlan) {
    const envValue = String((process.env as Record<string, string | undefined>)[item.envKey] || '').trim();
    if (envValue && envValue === value) return item.plan;
  }

  const normalized = value.toLowerCase();
  if (normalized.includes('enterprise')) return 'enterprise';
  if (normalized.includes('pro')) return 'pro';
  if (normalized.includes('free')) return 'free';
  return 'basic';
}

export function resolveBillingCycle(recurring: { interval?: string; interval_count?: number } | null | undefined) {
  const interval = String(recurring?.interval || 'month').toLowerCase();
  const count = Number(recurring?.interval_count || 1);
  return count > 1 ? `${count}_${interval}` : interval;
}

export function getConfiguredGraceDays() {
  const raw = Number(process.env.BILLING_GRACE_DAYS || 3);
  if (!Number.isFinite(raw)) return 3;
  return Math.max(0, Math.min(30, raw));
}

function addDays(base: Date, days: number) {
  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(base.getTime() + ms);
}

export function resolveSubscriptionLifecycle(input: {
  stripeStatus: string;
  existingGraceUntil?: string | null;
  graceDays: number;
}) {
  const stripeStatus = String(input.stripeStatus || '').toLowerCase();
  const internalSubscriptionStatus = mapStripeStatusToTenantStatus(stripeStatus);
  const now = new Date();
  const existingGrace = input.existingGraceUntil ? new Date(input.existingGraceUntil) : null;
  const graceDays = Math.max(0, Number(input.graceDays || 0));

  if (stripeStatus === 'active') {
    return {
      internalSubscriptionStatus,
      shopStatus: 'active' as const,
      graceUntil: null as string | null
    };
  }

  if (stripeStatus === 'trialing') {
    return {
      internalSubscriptionStatus,
      shopStatus: 'trial' as const,
      graceUntil: null as string | null
    };
  }

  if (stripeStatus === 'paused') {
    return {
      internalSubscriptionStatus,
      shopStatus: 'suspended' as const,
      graceUntil: null as string | null
    };
  }

  if (['past_due', 'unpaid'].includes(stripeStatus)) {
    const effectiveGrace = existingGrace && existingGrace > now
      ? existingGrace
      : addDays(now, graceDays);
    const isInsideGrace = effectiveGrace > now;
    return {
      internalSubscriptionStatus,
      shopStatus: (isInsideGrace ? 'active' : 'suspended') as 'active' | 'suspended',
      graceUntil: effectiveGrace.toISOString()
    };
  }

  if (['canceled', 'incomplete_expired'].includes(stripeStatus)) {
    return {
      internalSubscriptionStatus,
      shopStatus: 'disabled' as const,
      graceUntil: null as string | null
    };
  }

  return {
    internalSubscriptionStatus,
    shopStatus: internalSubscriptionStatus as 'active' | 'trial' | 'suspended' | 'disabled',
    graceUntil: null as string | null
  };
}
