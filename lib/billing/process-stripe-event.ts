import Stripe from 'stripe';
import { getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import { mapStripeStatusToTenantStatus } from '@/lib/server/billing-core';

function mapStripeStatusToShopStatus(status: string) {
  return mapStripeStatusToTenantStatus(status);
}

function mapStripeStatusToSubscriptionStatus(status: string) {
  return mapStripeStatusToTenantStatus(status);
}

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
  const shopStatus = mapStripeStatusToShopStatus(stripeStatus);
  const internalSubscriptionStatus = mapStripeStatusToSubscriptionStatus(stripeStatus);
  const priceId = subscriptionAny.items?.data?.[0]?.price?.id || null;
  const currentPeriodEnd = subscriptionAny.current_period_end
    ? new Date(subscriptionAny.current_period_end * 1000).toISOString()
    : null;

  await service.from('billing_subscriptions').upsert({
    barbershop_id: barbershopId,
    stripe_subscription_id: subscriptionAny.id,
    stripe_price_id: priceId,
    status: internalSubscriptionStatus,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: Boolean(subscriptionAny.cancel_at_period_end)
  });

  await service.from('barbershops').update({
    status: shopStatus,
    plan_expires_at: currentPeriodEnd
  }).eq('id', barbershopId);

  await service.from('subscriptions').insert({
    barbershop_id: barbershopId,
    plan: 'basic',
    status: internalSubscriptionStatus,
    started_at: new Date().toISOString(),
    expires_at: currentPeriodEnd
  });
}
