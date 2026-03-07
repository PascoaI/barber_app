import { NextResponse } from 'next/server';
import { getRouteAppSession } from '@/lib/auth/route-session';
import { getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import { getStripeClient } from '@/lib/billing/stripe';
import { logger } from '@/lib/observability/logger';
import { startTrace } from '@/lib/observability/tracing';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  const trace = startTrace('stripe.create_checkout_session');
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ error: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

    const limit = checkRateLimit({
      key: `api:stripe:create-checkout:${getClientIp(req)}`,
      limit: 30,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas requisicoes de checkout. Aguarde.' }, { status: 429 });
    }

    const session = await getRouteAppSession();
    if (!session || !['admin', 'super_admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const incomingBarbershopId = String(body?.barbershop_id || '').trim();
    const barbershopId = session.role === 'super_admin'
      ? incomingBarbershopId
      : (session.barbershopId || incomingBarbershopId);

    const explicitPriceId = String(body?.price_id || '').trim();
    const planKey = String(body?.plan || body?.plan_id || '').trim().toUpperCase();
    const envPriceId = planKey ? (process.env as Record<string, string | undefined>)[`STRIPE_PRICE_${planKey}`] : '';
    const priceId = explicitPriceId || String(envPriceId || '').trim();
    const successUrl = String(body?.success_url || '').trim() || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/subscriptions?billing=success`;
    const cancelUrl = String(body?.cancel_url || '').trim() || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/subscriptions?billing=cancel`;

    if (!barbershopId || !priceId) {
      return NextResponse.json({ error: 'Campos obrigatorios: barbershop_id e price_id.' }, { status: 400 });
    }

    if (session.role !== 'super_admin' && session.barbershopId && session.barbershopId !== barbershopId) {
      return NextResponse.json({ error: 'Escopo de barbearia invalido.' }, { status: 403 });
    }

    const service = getServiceClientForPrivilegedOps();
    const { data: shop, error: shopError } = await service
      .from('barbershops')
      .select('id,name,email,stripe_customer_id')
      .eq('id', barbershopId)
      .maybeSingle();
    if (shopError) throw shopError;
    if (!shop?.id) return NextResponse.json({ error: 'Barbearia nao encontrada.' }, { status: 404 });

    const stripe = getStripeClient();
    let customerId = shop.stripe_customer_id || '';
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: shop.email,
        name: shop.name,
        metadata: { barbershop_id: shop.id }
      });
      customerId = customer.id;
      await service.from('barbershops').update({ stripe_customer_id: customerId }).eq('id', shop.id);
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        barbershop_id: shop.id,
        initiated_by: session.userId
      }
    });

    logger.info('Stripe checkout session created.', {
      traceId: trace.traceId,
      barbershopId: shop.id,
      stripeSessionId: checkoutSession.id,
      by: session.userId
    });

    return NextResponse.json({
      id: checkoutSession.id,
      checkout_url: checkoutSession.url
    });
  } catch (error: any) {
    logger.error('Stripe checkout session failed.', {
      traceId: trace.traceId,
      error: error?.message || 'unknown_error'
    });
    return NextResponse.json({ error: error?.message || 'stripe_checkout_failed' }, { status: 500 });
  } finally {
    logger.info('Stripe checkout session finished.', trace.end());
  }
}
