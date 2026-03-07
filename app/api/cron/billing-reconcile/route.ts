import { NextResponse } from 'next/server';
import { getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import { getStripeClient } from '@/lib/billing/stripe';
import { logger } from '@/lib/observability/logger';
import {
  getConfiguredGraceDays,
  resolveBillingCycle,
  resolvePlanFromPriceId,
  resolveSubscriptionLifecycle
} from '@/lib/billing/lifecycle';

function getCronSecret() {
  return process.env.CRON_SECRET || '';
}

function isAuthorized(req: Request) {
  const expected = getCronSecret();
  if (!expected) return false;
  const incoming = req.headers.get('x-cron-secret') || '';
  return incoming === expected;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized cron call.' }, { status: 401 });

  const service = getServiceClientForPrivilegedOps();
  const stripe = getStripeClient();

  const { data: rows, error } = await service
    .from('billing_subscriptions')
    .select('barbershop_id,stripe_subscription_id,status,current_period_start,current_period_end,stripe_price_id,grace_until,grace_days,billing_cycle,plan');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let updated = 0;
  let inspected = 0;

  for (const row of rows || []) {
    inspected += 1;
    try {
      const subscriptionResponse = await stripe.subscriptions.retrieve(String(row.stripe_subscription_id));
      const subscription = subscriptionResponse as any;
      const priceId = subscription.items?.data?.[0]?.price?.id || row.stripe_price_id || null;
      const plan = resolvePlanFromPriceId(priceId);
      const billingCycle = resolveBillingCycle(subscription.items?.data?.[0]?.price?.recurring || null);
      const graceDays = Number(row.grace_days || getConfiguredGraceDays());
      const lifecycle = resolveSubscriptionLifecycle({
        stripeStatus: subscription.status,
        existingGraceUntil: row.grace_until || null,
        graceDays
      });
      const nowIso = new Date().toISOString();
      const currentPeriodStart = subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null;
      const currentPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      const shouldUpdate =
        lifecycle.internalSubscriptionStatus !== row.status ||
        currentPeriodStart !== row.current_period_start ||
        currentPeriodEnd !== row.current_period_end ||
        String(plan || '') !== String(row.plan || '') ||
        String(billingCycle || '') !== String(row.billing_cycle || '') ||
        String(lifecycle.graceUntil || '') !== String(row.grace_until || '');

      if (shouldUpdate) {
        await service
          .from('billing_subscriptions')
          .update({
            status: lifecycle.internalSubscriptionStatus,
            plan,
            billing_cycle: billingCycle,
            stripe_price_id: priceId,
            grace_days: graceDays,
            grace_until: lifecycle.graceUntil,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
            last_payment_failed_at: ['past_due', 'unpaid'].includes(String(subscription.status).toLowerCase()) ? nowIso : null,
            last_payment_succeeded_at: ['active', 'trialing'].includes(String(subscription.status).toLowerCase()) ? nowIso : null
          })
          .eq('stripe_subscription_id', row.stripe_subscription_id);

        await service
          .from('barbershops')
          .update({
            status: lifecycle.shopStatus,
            plan,
            plan_expires_at: currentPeriodEnd
          })
          .eq('id', row.barbershop_id);
        updated += 1;
      }
    } catch (errorRow: any) {
      logger.warn('Billing reconciliation item failed.', {
        stripeSubscriptionId: row.stripe_subscription_id,
        error: errorRow?.message || 'unknown_error'
      });
    }
  }

  logger.info('Billing reconciliation completed.', { inspected, updated });
  return NextResponse.json({ ok: true, inspected, updated });
}
