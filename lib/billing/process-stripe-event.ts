import Stripe from 'stripe';
import { getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import {
  getConfiguredGraceDays,
  resolveBillingCycle,
  resolvePlanFromPriceId,
  resolveSubscriptionLifecycle
} from '@/lib/billing/lifecycle';
import { recordBusinessMetric } from '@/lib/observability/metrics';

async function resolveBarbershopId(service: ReturnType<typeof getServiceClientForPrivilegedOps>, payload: Stripe.Event['data']['object']) {
  const metadataBarbershopId = (payload as any)?.metadata?.barbershop_id;
  if (metadataBarbershopId) return String(metadataBarbershopId);

  const customerId = (payload as any)?.customer;
  if (!customerId) return null;
  const { data: shopByCustomer } = await service
    .from('barbershops')
    .select('id')
    .eq('stripe_customer_id', String(customerId))
    .maybeSingle();
  return shopByCustomer?.id || null;
}

export async function processStripeSubscriptionEvent(params: {
  stripe: Stripe;
  service: ReturnType<typeof getServiceClientForPrivilegedOps>;
  event: Stripe.Event;
}) {
  const { stripe, service, event } = params;
  const payload = event.data.object as any;
  let subscription: Stripe.Subscription | null = null;

  if (event.type.startsWith('customer.subscription.')) {
    subscription = payload as Stripe.Subscription;
  } else if (event.type === 'checkout.session.completed' && payload?.subscription) {
    subscription = await stripe.subscriptions.retrieve(String(payload.subscription)) as unknown as Stripe.Subscription;
  } else if (event.type === 'invoice.payment_failed' && payload?.subscription) {
    subscription = await stripe.subscriptions.retrieve(String(payload.subscription)) as unknown as Stripe.Subscription;
  }

  if (!subscription) return;
  const subscriptionAny = subscription as any;

  const barbershopId = await resolveBarbershopId(service, subscriptionAny);
  if (!barbershopId) throw new Error('Missing barbershop context in Stripe webhook event.');

  const stripeStatus = subscriptionAny.status || 'trialing';
  const priceId = subscriptionAny.items?.data?.[0]?.price?.id || null;
  const recurring = subscriptionAny.items?.data?.[0]?.price?.recurring || null;
  const plan = resolvePlanFromPriceId(priceId);
  const cycle = resolveBillingCycle(recurring);

  const { data: currentBilling } = await service
    .from('billing_subscriptions')
    .select('grace_until,grace_days')
    .eq('barbershop_id', barbershopId)
    .maybeSingle();

  const graceDays = Number(currentBilling?.grace_days || getConfiguredGraceDays());
  const lifecycle = resolveSubscriptionLifecycle({
    stripeStatus,
    existingGraceUntil: currentBilling?.grace_until || null,
    graceDays
  });

  const currentPeriodEnd = subscriptionAny.current_period_end
    ? new Date(subscriptionAny.current_period_end * 1000).toISOString()
    : null;
  const currentPeriodStart = subscriptionAny.current_period_start
    ? new Date(subscriptionAny.current_period_start * 1000).toISOString()
    : null;
  const nowIso = new Date().toISOString();

  await service.from('billing_subscriptions').upsert({
    barbershop_id: barbershopId,
    stripe_subscription_id: subscriptionAny.id,
    stripe_price_id: priceId,
    plan,
    billing_cycle: cycle,
    status: lifecycle.internalSubscriptionStatus,
    grace_days: graceDays,
    grace_until: lifecycle.graceUntil,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: Boolean(subscriptionAny.cancel_at_period_end),
    last_payment_failed_at: ['past_due', 'unpaid'].includes(String(stripeStatus).toLowerCase()) ? nowIso : null,
    last_payment_succeeded_at: ['active', 'trialing'].includes(String(stripeStatus).toLowerCase()) ? nowIso : null
  });

  await service.from('barbershops').update({
    status: lifecycle.shopStatus,
    plan,
    plan_expires_at: currentPeriodEnd
  }).eq('id', barbershopId);

  await service.from('subscriptions').insert({
    barbershop_id: barbershopId,
    plan,
    status: lifecycle.internalSubscriptionStatus,
    started_at: nowIso,
    expires_at: currentPeriodEnd
  });

  if (event.type === 'invoice.payment_failed') {
    await recordBusinessMetric({
      metricType: 'payment_failure',
      metricName: 'billing.invoice_payment_failed',
      value: 1,
      barbershopId,
      tags: {
        stripeStatus: String(stripeStatus || '')
      }
    });
  }
}
