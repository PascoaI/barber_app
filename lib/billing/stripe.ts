import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) return stripeClient;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('Missing STRIPE_SECRET_KEY');
  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function getStripeWebhookSecret() {
  const value = process.env.STRIPE_WEBHOOK_SECRET;
  if (!value) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
  return value;
}
