import { NextResponse } from 'next/server';
import { getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import { getStripeClient } from '@/lib/billing/stripe';
import { logger } from '@/lib/observability/logger';
import { mapStripeStatusToTenantStatus } from '@/lib/server/billing-core';

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
    .select('barbershop_id,stripe_subscription_id,status,current_period_end');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let updated = 0;
  let inspected = 0;

  for (const row of rows || []) {
    inspected += 1;
    try {
      const subscriptionResponse = await stripe.subscriptions.retrieve(String(row.stripe_subscription_id));
      const subscription = subscriptionResponse as unknown as { status: string; current_period_end?: number; cancel_at_period_end?: boolean };
      const mapped = mapStripeStatusToTenantStatus(subscription.status);
      const currentPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      if (mapped !== row.status || currentPeriodEnd !== row.current_period_end) {
        await service
          .from('billing_subscriptions')
          .update({
            status: mapped,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: Boolean(subscription.cancel_at_period_end)
          })
          .eq('stripe_subscription_id', row.stripe_subscription_id);

        await service
          .from('barbershops')
          .update({
            status: mapped,
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
