import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import { processStripeSubscriptionEvent } from '@/lib/billing/process-stripe-event';
import { sendOperationalAlert } from '@/lib/observability/alerts';
import { logger } from '@/lib/observability/logger';
import { startTrace } from '@/lib/observability/tracing';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/billing/stripe';

export const runtime = 'nodejs';

function getNextRetryAt(retries: number) {
  const delayMinutes = Math.min(60, Math.max(5, retries * 5));
  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
}

export async function POST(req: Request) {
  const trace = startTrace('stripe.webhook');
  const stripe = getStripeClient();
  const service = getServiceClientForPrivilegedOps();

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  } catch (error: any) {
    logger.warn('Stripe webhook signature validation failed.', {
      traceId: trace.traceId,
      error: error?.message || 'invalid_signature'
    });
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  try {
    const { data: existing } = await service
      .from('billing_events')
      .select('id,status,retries')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    if (existing?.id && existing.status === 'processed') {
      return NextResponse.json({ ok: true, duplicated: true });
    }

    if (!existing?.id) {
      await service.from('billing_events').insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event,
        status: 'pending',
        retries: 0
      });
    }

    await processStripeSubscriptionEvent({ stripe, service, event });

    await service
      .from('billing_events')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        last_error: null,
        next_retry_at: null
      })
      .eq('stripe_event_id', event.id);

    logger.info('Stripe webhook processed.', {
      traceId: trace.traceId,
      eventId: event.id,
      eventType: event.type
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const { data: current } = await service
      .from('billing_events')
      .select('retries')
      .eq('stripe_event_id', event.id)
      .maybeSingle();
    const retries = Number(current?.retries || 0) + 1;

    await service
      .from('billing_events')
      .update({
        status: 'failed',
        retries,
        last_error: error?.message || 'webhook_processing_failed',
        next_retry_at: getNextRetryAt(retries)
      })
      .eq('stripe_event_id', event.id);

    logger.error('Stripe webhook processing failed.', {
      traceId: trace.traceId,
      eventId: event.id,
      eventType: event.type,
      retries,
      error: error?.message || 'unknown_error'
    });

    await sendOperationalAlert('stripe_webhook_failed', {
      eventId: event.id,
      eventType: event.type,
      retries,
      error: error?.message || 'unknown_error'
    });

    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  } finally {
    logger.info('Stripe webhook finished.', trace.end());
  }
}
