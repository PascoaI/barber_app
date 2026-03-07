import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import { processStripeSubscriptionEvent } from '@/lib/billing/process-stripe-event';
import { getStripeClient } from '@/lib/billing/stripe';
import { logger } from '@/lib/observability/logger';

function getCronSecret() {
  return process.env.CRON_SECRET || '';
}

function isAuthorized(req: Request) {
  const expected = getCronSecret();
  if (!expected) return false;
  const incoming = req.headers.get('x-cron-secret') || '';
  return incoming === expected;
}

function getNextRetryAt(retries: number) {
  const delayMinutes = Math.min(60, Math.max(5, retries * 5));
  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized cron call.' }, { status: 401 });
  }

  const service = getServiceClientForPrivilegedOps();
  const stripe = getStripeClient();
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await service
    .from('billing_events')
    .select('id,stripe_event_id,event_type,payload,retries')
    .eq('status', 'failed')
    .lte('next_retry_at', nowIso)
    .order('next_retry_at', { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  let failed = 0;
  for (const row of rows || []) {
    try {
      await processStripeSubscriptionEvent({
        stripe,
        service,
        event: row.payload as Stripe.Event
      });

      await service
        .from('billing_events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          last_error: null,
          next_retry_at: null
        })
        .eq('stripe_event_id', row.stripe_event_id);
      processed += 1;
    } catch (retryError: any) {
      const retries = Number(row.retries || 0) + 1;
      await service
        .from('billing_events')
        .update({
          retries,
          last_error: retryError?.message || 'retry_failed',
          next_retry_at: getNextRetryAt(retries)
        })
        .eq('stripe_event_id', row.stripe_event_id);
      failed += 1;
    }
  }

  logger.info('Billing retry cron completed.', { processed, failed, checked: (rows || []).length });
  return NextResponse.json({ ok: true, processed, failed, checked: (rows || []).length });
}
